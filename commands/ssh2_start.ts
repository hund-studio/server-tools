import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { nginx_add } from "./nginx_add";
import { nginx_stream } from "./nginx_stream";
import { timingSafeEqual } from "crypto";
import { utils, Server } from "ssh2";
import net from "net";
import sshConfig from "../utils/config/ssh2";

/**
 * ==========================================================
 * Section: Types and Interfaces
 * ----------------------------------------------------------
 * Description: Defines the types and interfaces used throughout
 * the SSH server, including server options and client settings.
 * ==========================================================
 */

interface SSHServerOptions {
    port?: number;
    user: string;
    verbose: boolean;
}

interface ClientOptions {
    requestedPort: null | number;
    externalPort: null | number;
    domain: null | string;
}

/**
 * ==========================================================
 * Section: Utility Functions
 * ----------------------------------------------------------
 * Description: Contains helper functions, including `checkValue()`
 * to securely compare input and allowed values using timing-safe
 * comparisons.
 * ==========================================================
 */

function checkValue(input: Buffer, allowed: Buffer) {
    const autoReject = input.length !== allowed.length;
    if (autoReject) {
        // Prevent leaking length information by always making a comparison with the
        // same input when lengths don't match what we expect ...
        allowed = input;
    }
    const isMatch = timingSafeEqual(input, allowed);
    return !autoReject && isMatch;
}

/**
 * ==========================================================
 * Section: Main SSH Server Logic
 * ----------------------------------------------------------
 * Description: Sets up the SSH server, handles client
 * authentication, session management, and command execution.
 * Includes retry logic for handling disconnections and reconnections.
 * ==========================================================
 */

export const ssh2_start = (options: SSHServerOptions) => {
    /**
     * ==========================================================
     * Section: SSH Key Preset
     * ----------------------------------------------------------
     * Description: Manages SSH private and public key generation
     * and loading. If keys already exist, they are loaded from
     * files. Otherwise, new keys are generated and saved.
     * ==========================================================
     */

    const privateKeyPath = join(sshConfig.root, "host.key");
    const publicKeyPath = join(sshConfig.root, "host.key.pub");

    let privateKey: string;
    let publicKey: string;

    if (existsSync(privateKeyPath)) {
        console.log("La chiave SSH esiste già, caricandola...");
        privateKey = readFileSync(privateKeyPath, "utf8");
        publicKey = readFileSync(publicKeyPath, "utf8");
    } else {
        console.log("La chiave SSH non è presente, ne sto generando una nuova...");
        const { private: newPrivateKey, public: newPublicKey } =
            utils.generateKeyPairSync("ed25519");

        writeFileSync(privateKeyPath, newPrivateKey, { mode: 0o600 });
        writeFileSync(publicKeyPath, newPublicKey);

        privateKey = newPrivateKey;
        publicKey = newPublicKey;

        console.log("Nuova coppia di chiavi SSH generata e salvata.");
    }

    const allowedPubKey = utils.parseKey(publicKey);
    const maxRetries = 5;
    let retryCount = 0;

    if (allowedPubKey instanceof Error) {
        throw new Error(allowedPubKey.message);
    }

    const connect = () => {
        try {
            const port = options["port"] || 4444;
            const [allowedUser, allowedPassword] = options["user"].split(":").map((fragment) => {
                if (!fragment) throw new Error("Invalid auth fragment");
                return Buffer.from(fragment);
            });

            const server = new Server(
                {
                    hostKeys: [privateKey],
                },
                (client) => {
                    console.log("Client connected!");

                    const clientOptions: ClientOptions = {
                        domain: null,
                        externalPort: null,
                        requestedPort: null,
                    };

                    client.on("authentication", (context) => {
                        let allowed = true;
                        if (!checkValue(Buffer.from(context.username), allowedUser))
                            allowed = false;

                        switch (context.method) {
                            case "password":
                                if (!checkValue(Buffer.from(context.password), allowedPassword))
                                    return context.reject();
                                break;
                            case "publickey":
                                const isSameType = context.key.algo === allowedPubKey.type;
                                const isSameData = checkValue(
                                    context.key.data,
                                    allowedPubKey.getPublicSSH()
                                );
                                const isValidSignature =
                                    context.signature &&
                                    context.blob &&
                                    allowedPubKey.verify(
                                        context.blob,
                                        context.signature,
                                        context.key.algo
                                    );
                                if (!isSameType || !isSameData || !isValidSignature) {
                                    return context.reject();
                                }
                                break;
                            default:
                                return context.reject();
                        }

                        if (allowed) context.accept();
                        else context.reject();
                    });

                    client.on("ready", () => {
                        console.log("Client authenticated!");

                        client.on("session", (accept, reject) => {
                            const session = accept();
                            session.once("exec", (accept, reject, info) => {
                                const stream = accept();

                                const [command, arg] = info.command.split(" ");

                                try {
                                    switch (command) {
                                        case "config_port":
                                            if (!arg || isNaN(Number(arg))) {
                                                throw new Error(
                                                    "Invalid or missing argument for config_port"
                                                );
                                            }
                                            clientOptions.requestedPort = Number(arg);
                                            stream.write(arg);
                                            break;

                                        case "config_external":
                                            if (!arg) {
                                                throw new Error(
                                                    "Missing argument for config_external"
                                                );
                                            }

                                            if (!clientOptions.requestedPort) {
                                                // Retry
                                            } else {
                                                clientOptions.externalPort = Number(arg);
                                                nginx_stream(arg, {
                                                    port: clientOptions.requestedPort,
                                                });
                                                stream.write(arg);
                                            }
                                            break;

                                        case "config_domain":
                                            if (!arg) {
                                                throw new Error(
                                                    "Missing argument for config_domain"
                                                );
                                            }

                                            if (!clientOptions.requestedPort) {
                                                // Retry
                                            } else {
                                                clientOptions.domain = arg;
                                                nginx_add(arg, {
                                                    template: "next-js",
                                                    port: clientOptions.requestedPort,
                                                });
                                                stream.write(arg);
                                            }
                                            break;

                                        case "request_port":
                                            if (clientOptions.requestedPort === undefined) {
                                                throw new Error("Port not configured yet");
                                            }
                                            stream.write(clientOptions.requestedPort);
                                            break;

                                        default:
                                            throw new Error("Invalid command");
                                    }
                                } catch (error) {
                                    if (error instanceof Error) {
                                        stream.stderr.write(`Error: ${error.message}\n`);
                                    } else {
                                        stream.stderr.write(`Error: unknown\n`);
                                    }
                                    stream.exit(1);
                                    stream.end();
                                    return;
                                }

                                stream.exit(0);
                                stream.end();
                            });
                        });
                    });

                    client.on("request", (accept, reject, name, info) => {
                        if (name === "tcpip-forward") {
                            const bindPort = info.bindPort;

                            accept && accept();

                            const server = net.createServer((socket) => {
                                console.log(socket.remoteAddress, socket.remotePort, bindPort);

                                client.forwardOut(
                                    "127.0.0.1",
                                    bindPort,
                                    socket.remoteAddress ?? "127.0.0.1",
                                    socket.remotePort ?? 0,
                                    (err, stream) => {
                                        if (err) {
                                            console.error("Forwarding error: ", err);
                                            socket.end();
                                            return;
                                        }

                                        socket.pipe(stream).pipe(socket);
                                    }
                                );
                            });

                            // server.listen(bindPort, () => {
                            server.listen(clientOptions.requestedPort, () => {
                                const addressInfo = server.address();
                                if (typeof addressInfo === "object" && addressInfo !== null) {
                                    clientOptions["requestedPort"] = addressInfo.port;
                                } else {
                                    console.log("Failed to retrieve port information.");
                                }
                            });

                            server.on("error", (error: unknown) => {
                                if (error instanceof Error) {
                                    console.error("Server error: ", error.message);
                                } else {
                                    console.error("Server error: ", "unknown");
                                }
                            });

                            client.on("close", () => {
                                server.close();
                                console.log("Client disconnected, closing forwarding server");
                            });
                        } else {
                            reject && reject();
                        }
                    });

                    client.on("close", () => {
                        console.log("Client disconnected");
                    });

                    client.on("error", (err) => {
                        console.error("Client error:", err);
                    });
                }
            );

            server.listen(port, "0.0.0.0", function () {
                console.log("Listening on port " + port);
            });

            server.on("error", (error: unknown) => {
                console.error("Server error:", error);
                retryConnection();
            });
        } catch (error) {
            retryConnection();
        }
    };

    const retryConnection = () => {
        if (retryCount < maxRetries) {
            retryCount++;
            const retryDelay = Math.pow(2, retryCount) * 1000;
            console.log(`Retrying connection in ${retryDelay / 1000} seconds...`);
            setTimeout(() => {
                connect();
            }, retryDelay);
        } else {
            console.error("Max retries reached. Unable to reconnect.");
        }
    };

    connect();
};
