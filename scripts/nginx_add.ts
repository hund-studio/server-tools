import chalk from "chalk";
import { getCommandArgValue } from "../utils/getCommandArgValue";
import { addVHost } from "../commands/nginx_addVHost";
import { reloadNginx } from "../commands/nginx_reload";
import { issueCert } from "../commands/certbot_issue";

const [domain, ...args] = process.argv.slice(2);

if (!domain) {
	console.log(chalk.magentaBright("You must specify a domain"));
}

const template = getCommandArgValue(args, "-t");
const port = getCommandArgValue(args, "-p");
const root = getCommandArgValue(args, "-r");

const init = async () => {
	console.log(chalk.magentaBright("=== START ==="));
};

init()
	.then(async () => {
		const isIssued = await issueCert(domain);

		if (isIssued !== true) {
			if (typeof isIssued === "string") {
				console.log(chalk.red(isIssued));
			}
			console.log(chalk.redBright("SSL Certificate has not available"));
		} else {
			console.log(chalk.greenBright("SSL Certificate successfully generated"));
		}

		console.log(chalk.greenBright(`Adding ${domain} to virtual hosts`));
		const createdVHost = await addVHost(domain, template, port, root, isIssued === true);

		if (createdVHost !== true) {
			if (typeof createdVHost === "string") {
				console.log(chalk.red(createdVHost));
			}
			console.log(chalk.redBright("Error during Nginx virtual host creation"));
			process.exit(0);
		} else {
			console.log(chalk.greenBright("Nginx virtual host successfully created"));
		}

		await reloadNginx();

		return;
	})
	.finally(() => {
		console.log(chalk.magenta("=== END ==="));
	});
