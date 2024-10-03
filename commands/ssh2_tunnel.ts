import { Client } from "ssh2";
import chalk from "chalk";
import net from "net";

const reconnectDelay = 2000;

export const ssh2_tunnel = (
    connectionString: string,
    options: { user: string; remotePort?: number; publicDomain?: string }
) => {
    const remotePort = options["remotePort"] || 0;
    const [localPort, remoteHost, remoteHostPort] = connectionString.split(":").map((i) => i);
    const [allowedUser, allowedPassword] = options["user"].split(":").map((i) => i);
    console.log(chalk.greenBright("Starting SSH2 tunnel"));

    const connection = new Client();

    const connect = () => {
        connection
            .on("ready", () => {
                console.log("Client :: ready");
                connection.exec(`config_port ${remotePort}`, (error, channel) => {
                    if (error) throw error;

                    channel.on("data", (data: string) => {
                        console.log("Your service is running on remote port", data.toString());
                    });

                    connection.forwardIn("127.0.0.1", Number(localPort), (error) => {
                        if (error) throw error;
                        console.log("Listening for connections on server on port", localPort);

                        connection.exec("request_port", (error, channel) => {
                            if (error) throw error;
                            channel.on("data", (data: string) => {
                                console.log(
                                    "Your service is running on remote port",
                                    data.toString()
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
                                    console.log("Serving on domain", data.toString());
                                });
                            }
                        );
                    }
                });
            })
            .on("tcp connection", (info, accept, reject) => {
                console.log("TCP :: INCOMING CONNECTION:");
                console.dir(info);

                const localConnection = net.createConnection(Number(localPort), "127.0.0.1", () => {
                    const remoteConnection = accept();

                    remoteConnection.pipe(localConnection);
                    localConnection.pipe(remoteConnection);
                });
            })
            .on("error", (error) => {
                console.error(chalk.red("Error occurred:", error.message));
                attemptReconnect();
            })
            .on("end", () => {
                console.log(chalk.yellow("Connection ended by remote server"));
                attemptReconnect();
            })
            .connect({
                host: remoteHost,
                port: Number(remoteHostPort),
                username: allowedUser,
                password: allowedPassword,
            });

        console.log(chalk.greenBright("SSH2 tunnel started"));
    };

    const attemptReconnect = () => {
        console.log(chalk.yellow(`Reconnecting in ${reconnectDelay / 1000} seconds...`));
        setTimeout(() => {
            console.log(chalk.greenBright("Reconnecting SSH2 tunnel..."));
            connect(); // Riavvia la connessione
        }, reconnectDelay);
    };

    connect();
};
