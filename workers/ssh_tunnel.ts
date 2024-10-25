import { ssh2_tunnel, SSHClientOptions } from "../commands/ssh2_tunnel";

const { parentPort } = require("worker_threads");

parentPort.on(
    "message",
    ({ connectionString, options }: { connectionString: string; options: SSHClientOptions }) => {
        ssh2_tunnel(connectionString, options);
    }
);
