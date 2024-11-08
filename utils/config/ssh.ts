import { resolve } from "path";
import globalConfig from "./global";

export default {
    root: resolve(globalConfig["appData"], "ssh"),
    version: "9.9",
};
