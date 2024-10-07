import { Client } from "ssh2";
import { logWithTime } from "../utils/log/logWithTime";
import chalk from "chalk";
import net from "net";

const reconnectionOptions: {
    delay: number;
    timeout?: NodeJS.Timeout;
} = {
    delay: 2000,
};

export const ssh2_tunnel = (
    connectionString: string,
    options: {
        externalPort?: number;
        publicDomain?: string;
        remotePort?: number;
        user: string;
        verbose: boolean;
    }
) => {
    const remotePort = options["remotePort"] || 0;
    const [localPort, remoteHost, remoteHostPort] = connectionString.split(":").map((i) => i);
    const [allowedUser, allowedPassword] = options["user"].split(":").map((i) => i);
    logWithTime("info", chalk.greenBright("Starting SSH2 tunnel"));

    const connect = () => {
        clearTimeout(reconnectionOptions["timeout"]);
        const connection = new Client();

        connection
            .on("ready", () => {
                logWithTime("info", chalk.greenBright("SSH2 tunnel started"));
                connection.exec(`config_port ${remotePort}`, (error, channel) => {
                    if (error) throw error;

                    channel.on("data", (data: string) => {
                        logWithTime(
                            "info",
                            chalk.greenBright(
                                "Your service is running on remote port",
                                data.toString()
                            )
                        );
                    });

                    connection.forwardIn("127.0.0.1", Number(localPort), (error) => {
                        if (error) {
                            logWithTime("error", chalk.red("Error occurred:", error));
                            throw error;
                        }

                        logWithTime(
                            "info",
                            chalk.greenBright(
                                "Listening for connections on server on port",
                                localPort
                            )
                        );

                        connection.exec("request_port", (error, channel) => {
                            if (error) throw error;
                            channel.on("data", (data: string) => {
                                logWithTime(
                                    "info",
                                    chalk.greenBright(
                                        "Your service is running on remote port",
                                        data.toString()
                                    )
                                );
                            });
                        });
                    });

                    if (options["publicDomain"]) {
                        connection.exec(
                            `config_domain ${options["publicDomain"]}`,
                            (error, channel) => {
                                if (error) throw error;

                                channel.on("data", (data: string) => {
                                    logWithTime("log", "Serving on domain", data.toString());
                                });
                            }
                        );
                    }

                    if (options["externalPort"]) {
                        connection.exec(
                            `config_external ${options["externalPort"]}`,
                            (error, channel) => {
                                if (error) throw error;

                                channel.on("data", (data: string) => {
                                    logWithTime("log", "Serving on external", data.toString());
                                });
                            }
                        );
                    }
                });

                // This is a tmp workaround
                setInterval(() => {
                    sendHeartbeat(connection);
                }, 10000);
            })
            .on("tcp connection", (info, accept, reject) => {
                const remoteConnection = accept();
                const localConnection = net.createConnection(Number(localPort), "127.0.0.1", () => {
                    remoteConnection.pipe(localConnection);
                    localConnection.pipe(remoteConnection);
                });

                localConnection.on("error", (error) => {
                    logWithTime(
                        "error",
                        chalk.red("Error connecting to local server:", error.message)
                    );
                    remoteConnection.end();
                    logWithTime(
                        "warn",
                        chalk.yellow("Sent an error response and closed remote connection")
                    );
                });
            })
            .on("error", (error) => {
                logWithTime("error", chalk.red("Error occurred:", error.message));
                attemptReconnect();
            })
            .on("end", () => {
                logWithTime("warn", chalk.yellow("Connection ended by remote server"));
                attemptReconnect();
            })
            .on("close", () => {
                logWithTime("warn", chalk.yellow("Connection closed by remote server"));
                attemptReconnect();
            })
            .connect({
                host: remoteHost,
                port: Number(remoteHostPort),
                username: allowedUser,
                password: allowedPassword,
                debug: options["verbose"]
                    ? (info) => logWithTime("log", chalk.blue(`SSH2 Debug: ${info}`))
                    : undefined,
                // This is a tmp workaround
                keepaliveInterval: 10000,
                keepaliveCountMax: 3,
            });
    };

    const attemptReconnect = () => {
        logWithTime(
            "warn",
            chalk.yellow(`Reconnecting in ${reconnectionOptions["delay"] / 1000} seconds...`)
        );
        reconnectionOptions["timeout"] = setTimeout(() => {
            logWithTime("info", chalk.greenBright("Reconnecting SSH2 tunnel..."));
            connect();
        }, reconnectionOptions["delay"]);
    };

    // This is a tmp workaround
    function sendHeartbeat(connection: Client) {
        connection.exec('echo "heartbeat"', (error, stream) => {
            if (error) {
                logWithTime("error", "Connection lost:", error);
                attemptReconnect();
            } else {
                stream
                    .on("close", () => {
                        logWithTime("info", "Heartbeat successful");
                    })
                    .on("data", (data: any) => {
                        logWithTime("log", "Heartbeat response:", data.toString());
                    });
            }
        });
    }

    connect();
};
