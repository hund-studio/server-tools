import chalk from "chalk";
import { executeCommand } from "../../utils/executeCommand";

export const stop = async (port: number) => {
    try {
        const result = await executeCommand(`lsof -ti :${port}`);
        if (result) {
            await executeCommand(`kill ${result.trim()}`);
            console.log(chalk.greenBright(`Stopped SSH instance on port ${port}.`));
        }
        return true;
    } catch (error) {
        return error instanceof Error ? error.message : false;
    }
};
