import { Client } from "ssh2";
import net from "net";

export interface SSHClientOptions {
    externalPort?: number;
    publicDomain?: string;
    remotePort?: number;
    user: string;
    verbose: boolean;
}

// @todo = usare la stessa di ssh2_start
interface ClientOptions {
    requestedPort: null | number;
    externalPort: null | number;
    domain: null | string;
}

export const ssh2_tunnel = (connectionString: string, options: SSHClientOptions) => {
    const maxRetries = 5;
    let retryCount = 0;

    const connect = () => {
        try {
            const client = new Client();
            const [portFrom, sshHost, sshPort] = connectionString.split(":");
            const [allowedUser, allowedPassword] = options["user"].split(":");
            const clientOptions: ClientOptions = {
                externalPort: options["externalPort"] || null,
                domain: options["publicDomain"] || null,
                requestedPort: options["remotePort"] || 0,
            };

            client.on("ready", () => {
                client.exec(`config_port ${clientOptions["requestedPort"]}`, (error, channel) => {
                    if (error) {
                        throw new Error(error["message"]);
                    }

                    // @todo = controllare questo type string
                    // @audit = questo probabilmente non serve
                    channel.on("data", (data: string) => {
                        // @todo implement response message
                    });

                    /**
                     * Start data forwarding
                     */
                    client.forwardIn("127.0.0.1", Number(portFrom), (error) => {
                        if (error) {
                            throw new Error(error["message"]);
                        }

                        /**
                         * Check which port has been assigned from server
                         */
                        client.exec("request_port", (error, channel) => {
                            if (error) {
                                throw new Error(error["message"]);
                            }

                            channel.on("data", (data: any) => {
                                console.log("Assigned:", data.toString());
                            });
                        });

                        /**
                         * If domain is set create a new NGINX vHost
                         */
                        if (clientOptions["domain"]) {
                            client.exec("config_domain", (error, channel) => {
                                if (error) {
                                    throw new Error(error["message"]);
                                }

                                channel.on("data", (data: any) => {
                                    console.log("Domain:", data.toString());
                                });
                            });
                        }

                        /**
                         * If external port is set create a new NGINX stream configuration
                         */
                        if (clientOptions["externalPort"]) {
                            client.exec("config_external", (error, channel) => {
                                if (error) {
                                    throw new Error(error["message"]);
                                }

                                channel.on("data", (data: any) => {
                                    console.log("External:", data.toString());
                                });
                            });
                        }
                    });
                });
            });

            client.on("tcp connection", (info, accept, reject) => {
                const remoteConnection = accept();
                const localConnection = net.createConnection(Number(portFrom), "127.0.0.1", () => {
                    remoteConnection.pipe(localConnection);
                    localConnection.pipe(remoteConnection);
                });
            });

            client.on("error", (err) => {
                console.error("SSH client error:", err);
                retryConnection();
            });

            client.on("close", () => {
                console.log("SSH client disconnected");
                retryConnection();
            });

            client.connect({
                host: sshHost,
                port: Number(sshPort),
                username: allowedUser,
                password: allowedPassword,
                debug: options["verbose"] ? console.log : undefined,
            });
        } catch (error) {
            console.error("Connection error:", error);
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
