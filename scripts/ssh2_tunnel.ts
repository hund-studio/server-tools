import chalk from "chalk";
import { Client } from "ssh2";

console.log(chalk.greenBright("Starting SSH2 tunnel"));

const conn = new Client();
conn
	.on("ready", () => {
		console.log("Client :: ready");
		conn.forwardIn("127.0.0.1", 8000, (err) => {
			if (err) throw err;
			console.log("Listening for connections on server on port 8000!");
		});
	})
	.on("tcp connection", (info, accept, reject) => {
		console.log("TCP :: INCOMING CONNECTION:");
		console.dir(info);
		accept()
			.on("close", () => {
				console.log("TCP :: CLOSED");
			})
			.on("data", (data: any) => {
				console.log("TCP :: DATA: " + data);
			})
			.end(
				[
					"HTTP/1.1 404 Not Found",
					"Date: Thu, 15 Nov 2012 02:07:58 GMT",
					"Server: ForwardedConnection",
					"Content-Length: 0",
					"Connection: close",
					"",
					"",
				].join("\r\n")
			);
	})
	.connect({
		host: "127.0.0.1",
		port: 4444,
		username: "foo",
		password: "bar",
	});
console.log(chalk.greenBright("SSH2 tunnel started"));
