import { appendFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export const writeToFile = (logFilePath: string, logMessage: string) => {
    try {
        const dir = dirname(logFilePath);

        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        appendFileSync(logFilePath, `${logMessage}\n`, { encoding: "utf-8" });
    } catch (error) {
        // donothing
    }
};
