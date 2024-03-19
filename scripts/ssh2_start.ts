import { Server, utils } from "ssh2";
import { timingSafeEqual } from "crypto";
import chalk from "chalk";
import net from "net";

console.log(chalk.greenBright("Starting SSH2 server"));
const keys = utils.generateKeyPairSync("ed25519");
const allowedUser = Buffer.from("foo");
const allowedPassword = Buffer.from("bar");
const allowedPubKey = utils.parseKey(keys["public"]);

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

				client
					.on("session", (accept, reject) => {
						let session = accept();
						session.on("shell", (accept, reject) => {
							let stream = accept();
						});
					})
					.on("request", (accept, reject, name, info) => {
						if (name === "tcpip-forward") {
							accept && accept();
							net
								.createServer((socket) => {
									socket.setEncoding("utf8");
									if (socket["remoteAddress"] && socket["remotePort"]) {
										client.forwardOut(
											info.bindAddr,
											info.bindPort,
											socket.remoteAddress,
											socket.remotePort,
											(err, upstream) => {
												if (err) {
													socket.end();
													return console.error("not working: " + err);
												}
												upstream.pipe(socket).pipe(upstream);
											}
										);
									}
								})
								.listen(info.bindPort);
						} else {
							reject && reject();
						}
					});
			})
			.on("close", () => {
				console.log("Client disconnected");
			});
	}
).listen(4444, "127.0.0.1", () => {
	console.log(chalk.greenBright("SSH2 server started"));
});
