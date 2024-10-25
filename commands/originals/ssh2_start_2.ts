import { logWithTime } from "../../utils/log/logWithTime";
import { nginx_add } from "../nginx_add";
import { nginx_stream } from "../nginx_stream";
import { timingSafeEqual } from "crypto";
import chalk from "chalk";
import net from "net";
import ssh2, { Connection, Server, utils } from "ssh2";

interface ServerOptions {
    port?: number;
    user: string;
    verbose: boolean;
}

const DEFAULT_PORT = 4444;

const keys = utils.generateKeyPairSync("ed25519");
const serverPubKey = utils.parseKey(keys["public"]);

const checkValue = (input: Buffer, allowed: Buffer) => {
    if (input.length !== allowed.length) {
        return false; // Modificato: niente riassegnazione, confronto sicuro
    }

    return timingSafeEqual(input, allowed);
};

const assignPort = (requestedPort?: number) => {
    return requestedPort || DEFAULT_PORT;
};

const decodeAuthString = (authString: string): [Buffer, Buffer] => {
    const [allowedUser, allowedPassword] = authString.split(":").map((i) => Buffer.from(i));

    if (!allowedPassword) throw new Error("Invalid auth string, password is undefined");
    if (!allowedUser) throw new Error("Invalid auth string, user is undefined");

    return [allowedUser, allowedPassword];
};

const close = ({ server, client }: { server?: net.Server; client?: ssh2.Connection }) => {
    if (server) {
        server.close(() => logWithTime("info", "Server closed"));
        server.removeAllListeners();
    }
    if (client) {
        client.end();
        client.removeAllListeners();
    }
};

const handleAuthentication = (
    authContext: ssh2.AuthContext,
    serverConfig: { user: Buffer; password: Buffer; pubKey: ssh2.ParsedKey }
) => {
    let allowed = true;
    if (!checkValue(Buffer.from(authContext.username), serverConfig.user)) allowed = false;

    switch (authContext.method) {
        case "password":
            if (!checkValue(Buffer.from(authContext.password), serverConfig.password))
                return authContext.reject();
            break;
        case "publickey":
            if (
                authContext.key.algo !== serverConfig.pubKey.type ||
                !checkValue(authContext.key.data, serverConfig.pubKey.getPublicSSH()) ||
                (authContext.signature &&
                    authContext.blob &&
                    !serverConfig.pubKey.verify(
                        authContext.blob,
                        authContext.signature,
                        authContext.key.algo
                    ))
            ) {
                return authContext.reject();
            }
            break;
        default:
            return authContext.reject();
    }

    allowed ? authContext.accept() : authContext.reject();
};

export const start = (options: ServerOptions) => {
    const port = assignPort(options.port);
    const [serverUser, serverPassword] = decodeAuthString(options.user);

    logWithTime("info", "Starting SSH2 server");

    if (serverPubKey instanceof Error) {
        throw new Error(serverPubKey.message);
    }

    new Server(
        {
            hostKeys: [keys.private],
        },
        (client) => {
            logWithTime("info", "Incoming client connection");

            let requestedPort: number | undefined;
            let server: net.Server | undefined;

            client
                .on("authentication", (context) =>
                    handleAuthentication(context, {
                        user: serverUser,
                        password: serverPassword,
                        pubKey: serverPubKey,
                    })
                )
                .on("ready", () => {
                    logWithTime("info", "Client authenticated");

                    client
                        .on("session", (accept, reject) => {
                            const session = accept();

                            if (session) {
                                session.once("exec", (accept, reject, info) => {
                                    const stream = accept();

                                    if (!stream) {
                                        reject();
                                        logWithTime("error", "Failed to accept stream");
                                        return;
                                    }

                                    const [command, arg] = info.command.split(" ");

                                    switch (command) {
                                        case "config_port":
                                            requestedPort = Number(arg);
                                            stream.exit(0);
                                            break;
                                        case "config_external":
                                            nginx_stream(arg, {
                                                port: requestedPort,
                                            });
                                            stream.exit(0);
                                            break;
                                        case "config_domain":
                                            nginx_add(arg, {
                                                template: "next-js",
                                                port: requestedPort,
                                            });
                                            stream.exit(0);
                                            break;
                                        case "request_port":
                                            if (requestedPort !== undefined) {
                                                stream.write(`${requestedPort}`);
                                            } else {
                                                stream.stderr.write("Requested port not set");
                                            }
                                            stream.exit(0);
                                            break;
                                        default:
                                            stream.stderr.write("Invalid command");
                                            logWithTime("warn", `Unknown command: ${command}`);
                                            stream.exit(1);
                                    }

                                    stream.end();
                                });
                            } else {
                                logWithTime("warn", "Session was undefined during session setup");
                                reject && reject();
                            }
                        })
                        .on("request", (accept, reject, name, info) => {
                            if (name === "tcpip-forward") {
                                accept && accept();

                                const maxRetries = 3;
                                const retryDelay = 2000;

                                function tryForwardOut(
                                    retries: number,
                                    socket: net.Socket,
                                    client: Connection
                                ) {
                                    if (socket.remoteAddress && socket.remotePort) {
                                        client.forwardOut(
                                            info.bindAddr,
                                            info.bindPort,
                                            socket.remoteAddress,
                                            socket.remotePort,
                                            (error, upstream) => {
                                                if (error) {
                                                    logWithTime(
                                                        "error",
                                                        "forwardOut failed:",
                                                        error.message
                                                    );
                                                    if (retries < maxRetries) {
                                                        logWithTime(
                                                            "warn",
                                                            `Retrying forwardOut... Attempt ${
                                                                retries + 1
                                                            }`
                                                        );
                                                        setTimeout(
                                                            () =>
                                                                tryForwardOut(
                                                                    retries + 1,
                                                                    socket,
                                                                    client
                                                                ),
                                                            retryDelay
                                                        );
                                                    } else {
                                                        logWithTime(
                                                            "error",
                                                            `Max retry attempts reached. Closing socket.`
                                                        );
                                                        socket.end();
                                                    }
                                                } else {
                                                    upstream.pipe(socket).pipe(upstream);
                                                }
                                            }
                                        );
                                    } else {
                                        socket.end();
                                    }
                                }

                                server = net.createServer((socket) => {
                                    socket.on("error", (error) => {
                                        logWithTime("error", "#1", error.message);
                                        socket.end();
                                    });

                                    tryForwardOut(0, socket, client);
                                });

                                server
                                    .listen(requestedPort)
                                    .on("listening", () => {
                                        const address = server?.address();

                                        if (address) {
                                            logWithTime("info", "Server started");

                                            if (typeof address !== "string") {
                                                logWithTime("info", "Requested port", address.port);
                                                requestedPort = address.port;
                                            } else {
                                                logWithTime("warn", "Address was a string");
                                                close({ server, client });
                                            }
                                        } else {
                                            logWithTime("warn", "Server address is undefined");
                                            close({ server, client });
                                        }
                                    })
                                    .on("error", (error) => {
                                        logWithTime("error", "Server error:", error.message);
                                        close({ server, client });
                                    });
                            } else {
                                reject && reject();
                            }
                        });
                })
                .on("error", (error) => {
                    try {
                        logWithTime("error", "#2", error.message);
                    } catch (err) {
                        logWithTime("error", "#2 unknown error during client handling");
                    }
                })
                .on("close", () => {
                    try {
                        logWithTime("warn", "#3 Client disconnected");
                        close({ server, client });
                    } catch (err) {
                        if (err instanceof Error) {
                            logWithTime("error", "Error during client disconnect", err.message);
                        } else {
                            logWithTime("error", "Error during client disconnect", "unknown");
                        }
                    }
                });
        }
    ).listen(port, "0.0.0.0", () => {
        logWithTime("info", chalk.greenBright("SSH2 server started on port", port));
    });
};

export const ssh2_start = (options: ServerOptions) => {
    let retryCount = 0;
    const maxRetries = 5;

    function startWithBackoff() {
        if (retryCount >= maxRetries) {
            logWithTime("error", "Max retry attempts reached. Aborting.");
            return;
        }

        try {
            start(options);
        } catch (error) {
            retryCount++;
            logWithTime("warn", `A critical error occurred. Retry #${retryCount}`);

            if (error instanceof Error) {
                logWithTime("error", error.message);
            } else {
                logWithTime("error", "Unknown error type");
            }

            const backoffDelay = Math.pow(2, retryCount) * 1000; // Backoff esponenziale
            setTimeout(startWithBackoff, backoffDelay);
        }
    }

    startWithBackoff();
};
