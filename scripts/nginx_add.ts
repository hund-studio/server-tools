import { getCommandArgValue } from "../utils/getCommandArgValue";
import { nginx_add } from "../commands/nginx_add";
import chalk from "chalk";

const [domain, ...args] = process.argv.slice(2);

if (!domain) {
	console.log(chalk.redBright("domain parameter is required"));
	process.exit(1);
}

const template = getCommandArgValue(args, "-t");
const port = getCommandArgValue(args, "-p");
const root = getCommandArgValue(args, "-r");

nginx_add(domain, { template, port, root });
