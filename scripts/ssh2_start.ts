import { getCommandArgValue } from "../utils/getCommandArgValue";
import { Server, Session, utils } from "ssh2";
import { timingSafeEqual } from "crypto";
import chalk from "chalk";
import net from "net";
import { nginx_add } from "../commands/nginx_add";

const keys = utils.generateKeyPairSync("ed25519");
const allowedPubKey = utils.parseKey(keys["public"]);
const args = process.argv.slice(2);
const port = Number(getCommandArgValue(args, "-p")) || 4444;
const user = getCommandArgValue(args, "-u");

if (!user) {
	console.log(chalk.redBright("-u parameter is required"));
	process.exit(1);
}

const [allowedUser, allowedPassword] = user?.split(":").map((i) => Buffer.from(i));

console.log(chalk.greenBright("Starting SSH2 server"));

if (allowedPubKey instanceof Error) {
	throw new Error();
}

function checkValue(input: Buffer, allowed: Buffer) {
	const autoReject = input.length !== allowed.length;
	if (autoReject) {
		allowed = input;
	}
	const isMatch = timingSafeEqual(input, allowed);
	return !autoReject && isMatch;
}

new Server(
	{
		hostKeys: [keys["private"]],
	},
	(client) => {
		console.log("Client connected!");

		client
			.on("authentication", (ctx) => {
				let allowed = true;
				if (!checkValue(Buffer.from(ctx.username), allowedUser)) allowed = false;

				switch (ctx.method) {
					case "password":
						if (!checkValue(Buffer.from(ctx.password), allowedPassword)) return ctx.reject();
						break;
					case "publickey":
						if (
							ctx.key.algo !== allowedPubKey.type ||
							!checkValue(ctx.key.data, allowedPubKey.getPublicSSH()) ||
							(ctx.signature &&
								ctx.blob &&
								allowedPubKey.verify(ctx.blob, ctx.signature, ctx.key.algo) !== true)
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
				console.log("Client authenticated!");
				let session: Session;
				let requestedPort: number;

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
								case "config_domain":
									nginx_add(arg, { template: "next-js", port: requestedPort });
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
							const server = net.createServer((socket) => {
								socket.setEncoding("utf8");

								socket.on("error", (error) => {
									console.log("#1", error);
								}); // DO not touch

								if (socket["remoteAddress"] && socket["remotePort"]) {
									client.forwardOut(
										info.bindAddr,
										info.bindPort,
										socket.remoteAddress,
										socket.remotePort,
										(error, upstream) => {
											if (error) {
												socket.end();
												return console.error("not working:", error);
											}
											upstream.pipe(socket).pipe(upstream);
										}
									);
								} else {
									socket.end();
								}
							});

							const close = () => {
								server.close();
								client.end();
							};

							server
								.listen(requestedPort)
								.on("listening", () => {
									const address = server.address();

									console.log("Starting");

									if (!address) {
										return close();
									}

									if (typeof address === "string") {
										return close();
									}

									console.log(address["port"]);

									requestedPort = address["port"];
								})
								.on("error", () => {
									return close();
								});
						} else {
							reject && reject();
						}
					});
			})
			.on("close", () => {
				console.log("Client disconnected");
			});
	}
).listen(port, "127.0.0.1", () => {
	console.log(chalk.greenBright("SSH2 server started on port", port));
});
