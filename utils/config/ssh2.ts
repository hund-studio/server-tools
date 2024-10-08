import { resolve } from "path";
import globalConfig from "./global";

export default {
    root: resolve(globalConfig["appData"], "ssh"),
    logs: resolve(globalConfig["appData"], "ssh/logs"),
};
