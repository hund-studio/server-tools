import chalk from "chalk";
import { ExecOptions, exec } from "child_process";

export const executeCommand = (command: string, options?: ExecOptions): Promise<void> => {
	return new Promise((resolve, reject) => {
		console.log(chalk.blueBright("Command: ", command));

		const childProcess = exec(command, options);

		childProcess.stdout?.on("data", (data) => {
			console.log(chalk.blackBright(data.toString().trim()));
		});

		childProcess.stderr?.on("data", (data) => {
			console.error(chalk.blackBright(data.toString().trim()));
		});

		childProcess.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Command '${command}' failed with code ${code}`));
			}
		});
	});
};
