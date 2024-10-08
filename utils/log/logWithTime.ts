import { writeToFile } from "./writeToFile";
import ssh2Config from "../config/ssh2";

const logPrefixes = {
    error: "[Error]",
    warn: "[Warn ]",
    info: "[Info ]",
    log: "[Log  ]",
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
    type: keyof typeof logPrefixes,
    message?: any,
    ...optionalParams: any[]
) => {
    const today = formatDate(new Date(), "yyyy-mm-dd");
    const line = [`[${formatDate(new Date())}]`, message, ...optionalParams].join(" ");
    console.log(logPrefixes[type], line);
    if (type !== "log") {
        writeToFile(`${ssh2Config["logs"]}/${today}.txt`, line);
    }
};
