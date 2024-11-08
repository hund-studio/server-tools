import chalk from "chalk";
import { ExecOptions, exec } from "child_process";

export const executeCommand = (command: string, options?: ExecOptions): Promise<string> => {
    return new Promise((resolve, reject) => {
        console.log(chalk.blueBright("Command: ", command));

        const childProcess = exec(command, options);
        let output = "";

        childProcess.stdout?.on("data", (data) => {
            const text = data.toString().trim();
            output += text + "\n";
            console.log(chalk.blackBright(text));
        });

        childProcess.stderr?.on("data", (data) => {
            const text = data.toString().trim();
            output += text + "\n";
            console.error(chalk.blackBright(text));
        });

        childProcess.on("exit", (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`Command '${command}' failed with code ${code}`));
            }
        });
    });
};
