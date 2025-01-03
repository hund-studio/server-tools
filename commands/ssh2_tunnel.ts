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

                    channel.on("data", (data: string) => {
                        console.log("Config port response:", data.toString());
                    });

                    // Avvia il port forwarding
                    startForwarding(client);
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

    const startForwarding = (client: Client) => {
        const [portFrom] = connectionString.split(":");

        client.forwardIn("127.0.0.1", Number(portFrom), (error) => {
            if (error) {
                throw new Error(error["message"]);
            }
            console.log("Port forwarding started on port:", portFrom);

            // Inizia a controllare periodicamente lo stato del forwarding
            setInterval(checkForwardingStatus, 10000, client);
        });
    };

    const checkForwardingStatus = (client: Client) => {
        const [portFrom] = connectionString.split(":");

        const testConnection = net.createConnection(Number(portFrom), "127.0.0.1");

        testConnection.on("connect", () => {
            console.log("Forwarding is active.");
            testConnection.end();
        });

        testConnection.on("error", () => {
            console.log("Forwarding interrupted. Attempting to re-establish...");
            retryForwarding(client);
        });
    };

    const retryForwarding = (client: Client) => {
        const [portFrom] = connectionString.split(":");

        setTimeout(() => {
            client.forwardIn("127.0.0.1", Number(portFrom), (error) => {
                if (error) {
                    console.error("Retrying forwarding failed:", error);
                    retryForwarding(client);
                } else {
                    console.log("Forwarding re-established");
                }
            });
        }, 5000);
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
