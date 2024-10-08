import { homedir } from "os";
import { resolve } from "path";

const appData = resolve(homedir(), ".server-tools");

export default {
    appData,
    email: "developer@hund.studio",
    sources: resolve(appData, "sources"),
};
