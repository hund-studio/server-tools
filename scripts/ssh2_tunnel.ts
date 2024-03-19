import { Client } from "ssh2";
import { getCommandArgValue } from "../utils/getCommandArgValue";
import chalk from "chalk";
import net from "net";

const [connectionString, ...args] = process.argv.slice(2);
const userArg = getCommandArgValue(args, "-u");
const remoteTargetPort = getCommandArgValue(args, "-p") || 0;

if (!connectionString) {
	console.log(chalk.redBright("You must specify a connection parameter"));
	process.exit(1);
}

if (!userArg) {
	console.log(chalk.redBright("-u parameter is required"));
	process.exit(1);
}

const [localPort, remoteHost, remoteHostPort] = connectionString?.split(":").map((i) => i);
const [allowedUser, allowedPassword] = userArg?.split(":").map((i) => i);

console.log(chalk.greenBright("Starting SSH2 tunnel"));

const conn = new Client();
conn
	.on("ready", () => {
		console.log("Client :: ready");

		conn.exec("port", (error, channel) => {
			channel.on("data", (data: string) => {
				console.log("Your service is running on remote port", data.toString());
			});
		});

		conn.forwardIn("127.0.0.1", Number(localPort), (err) => {
			if (err) throw err;
			console.log("Listening for connections on server on port", localPort);
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
	.connect({
		host: remoteHost,
		port: Number(remoteHostPort),
		username: allowedUser,
		password: allowedPassword,
	});
console.log(chalk.greenBright("SSH2 tunnel started"));
