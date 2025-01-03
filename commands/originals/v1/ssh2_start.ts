import { Connection, Server, Session, utils } from "ssh2";
import { logWithTime } from "../../../utils/log/logWithTime";
import { nginx_add } from "../../nginx_add";
import { nginx_stream } from "../../nginx_stream";
import { timingSafeEqual } from "crypto";
import chalk from "chalk";
import net from "net";

const keys = utils.generateKeyPairSync("ed25519");
const allowedPubKey = utils.parseKey(keys["public"]);

const checkValue = (input: Buffer, allowed: Buffer) => {
    const autoReject = input.length !== allowed.length;
    if (autoReject) {
        allowed = input;
    }
    const isMatch = timingSafeEqual(input, allowed);
    return !autoReject && isMatch;
};

export const ssh2_start = (options: { port?: number; user: string; verbose: boolean }) => {
    const port = options["port"] || 4444;
    const [allowedUser, allowedPassword] = options["user"].split(":").map((i) => Buffer.from(i));
    logWithTime("info", chalk.greenBright("Starting SSH2 server"));

    if (allowedPubKey instanceof Error) {
        throw new Error();
    }

    new Server(
        {
            hostKeys: [keys["private"]],
        },
        (client) => {
            logWithTime("info", "Client connected!");

            let session: Session;
            let requestedPort: number;
            let server: net.Server;

            const close = () => {
                server && server.close();
                client.end();
            };

            client
                .on("authentication", (ctx) => {
                    let allowed = true;
                    if (!checkValue(Buffer.from(ctx.username), allowedUser)) allowed = false;

                    switch (ctx.method) {
                        case "password":
                            if (!checkValue(Buffer.from(ctx.password), allowedPassword))
                                return ctx.reject();
                            break;
                        case "publickey":
                            if (
                                ctx.key.algo !== allowedPubKey.type ||
                                !checkValue(ctx.key.data, allowedPubKey.getPublicSSH()) ||
                                (ctx.signature &&
                                    ctx.blob &&
                                    allowedPubKey.verify(ctx.blob, ctx.signature, ctx.key.algo) !==
                                        true)
                            ) {
                                return ctx.reject();
                            }
                            break;
                        default:
                            return ctx.reject();
                    }

                    if (allowed) ctx.accept();
                    else ctx.reject();
                })
                .on("ready", () => {
                    logWithTime("info", "Client authenticated!");

                    client
                        .on("session", (accept, reject) => {
                            session = accept();

                            session.once("exec", (accept, reject, info) => {
                                const stream = accept();
                                const command = info.command.split(" ")[0];
                                const arg = info.command.split(" ")[1];

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
                                        stream.write(`${requestedPort}`);
                                        stream.exit(0);
                                        break;
                                    default:
                                        stream.stderr.write("Invalid command");
                                        stream.exit(1);
                                }

                                stream.end();
                            });

                            session.on("shell", (accept, reject) => {
                                let stream = accept();
                            });
                        })
                        .on("request", (accept, reject, name, info) => {
                            if (name === "tcpip-forward") {
                                accept && accept();
                                // accept && accept(port); // useful to comunicato to client if port is preset, not our case

                                /**
                                 *
                                 */

                                const maxRetries = 3;
                                const retryDelay = 2000;

                                function tryForwardOut(
                                    retries: number,
                                    socket: net.Socket,
                                    client: Connection
                                ) {
                                    if (socket["remoteAddress"] && socket["remotePort"]) {
                                        client.forwardOut(
                                            info.bindAddr,
                                            info.bindPort,
                                            socket.remoteAddress,
                                            socket.remotePort,
                                            (error, upstream) => {
                                                if (error) {
                                                    logWithTime("error", "not working:", error);
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

                                        client.on("close", () => {
                                            logWithTime("warn", "Client disconnected");
                                            close();
                                        });
                                    } else {
                                        socket.end();
                                    }
                                }

                                /**
                                 *
                                 */

                                server = net.createServer((socket) => {
                                    // socket.setEncoding("utf8"); // remove to work with buffer (ae. Minecraft)

                                    socket.on("error", (error) => {
                                        logWithTime("error", "#1", error);
                                        socket.end();
                                    }); // DO not touch

                                    tryForwardOut(0, socket, client);
                                    // if (socket["remoteAddress"] && socket["remotePort"]) {
                                    //     client.forwardOut(
                                    //         info.bindAddr,
                                    //         info.bindPort,
                                    //         socket.remoteAddress,
                                    //         socket.remotePort,
                                    //         (error, upstream) => {
                                    //             if (error) {
                                    //                 socket.end();
                                    //                 return logWithTime('error', "not working:", error);
                                    //             }
                                    //             upstream.pipe(socket).pipe(upstream);
                                    //         }
                                    //     );
                                    // } else {
                                    //     socket.end();
                                    // }
                                });

                                server
                                    .listen(requestedPort)
                                    .on("listening", () => {
                                        const address = server.address();

                                        logWithTime("info", "Starting");

                                        if (!address) {
                                            return close();
                                        }

                                        if (typeof address === "string") {
                                            return close();
                                        }

                                        logWithTime("info", "Requested port", address["port"]);

                                        requestedPort = address["port"];
                                    })
                                    .on("error", (error) => {
                                        return close();
                                    });
                            } else {
                                reject && reject();
                            }
                        });
                })
                .on("error", (error) => {
                    logWithTime("error", "#2", error);
                }) // DO not touch
                .on("close", () => {
                    logWithTime("warn", "Client disconnected");
                    close();
                });
        }
    ).listen(port, "0.0.0.0", () => {
        logWithTime("info", chalk.greenBright("SSH2 server started on port", port));
    });
};

/*

DEBUG

ssh -o "HostKeyAlgorithms=ssh-dss" -p 4242 ernesto@51.178.137.42
Unable to negotiate with 51.178.137.42 port 4242: no matching host key type found. Their offer: ssh-ed25519

*/
