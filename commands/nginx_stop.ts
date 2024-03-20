import chalk from "chalk";
import { stopNginx } from "../shell/nginx_stop";

export const nginx_stop = async () => {
	/* */
	console.log(chalk.magentaBright("=== START ==="));

	/* */
	console.log(chalk.greenBright("Stopping Nginx..."));
	await stopNginx();

	/* */
	console.log(chalk.magentaBright("=== END ==="));
};
