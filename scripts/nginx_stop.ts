import chalk from "chalk";
import { stopNginx } from "../shell/nginx_stop";

const init = async () => {
	console.log(chalk.magentaBright("=== START ==="));
};

init()
	.then(async () => {
		console.log(chalk.greenBright("Stopping Nginx"));
		await stopNginx();
		return;
	})
	.finally(() => {
		console.log(chalk.magenta("=== END ==="));
	});
