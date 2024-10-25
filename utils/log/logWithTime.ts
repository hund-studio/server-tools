import { writeToFile } from "./writeToFile";
import ssh2Config from "../config/ssh2";
import chalk, { Chalk } from "chalk";

const logStates: Record<string, [string, Chalk]> = {
    error: ["[Error]", chalk.redBright],
    warn: ["[Warn ]", chalk.yellow],
    info: ["[Info ]", chalk.white],
    log: ["[Log  ]", chalk.blue],
};

const formatDate = (date: Date, format = "dd-mm-yyyy hh:ii:ss") => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return format
        .replace("dd", day)
        .replace("mm", month)
        .replace("yyyy", String(year))
        .replace("hh", hours)
        .replace("ii", minutes)
        .replace("ss", seconds);
};

export const logWithTime = (
    type: keyof typeof logStates,
    message?: any,
    ...optionalParams: any[]
) => {
    const [prefix, color] = logStates[type]
    const line = [message, ...optionalParams].join(" ");
    const timestamp = `[${formatDate(new Date())}]`
    const today = formatDate(new Date(), "yyyy-mm-dd");

    console.log(timestamp, color(prefix, line));

    if (type !== "log") {
        writeToFile(`${ssh2Config["logs"]}/${today}.txt`, [timestamp, prefix, line].join(' '));
    }
};
