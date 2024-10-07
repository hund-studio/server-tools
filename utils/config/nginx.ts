import { resolve } from "path";
import globalConfig from "./global";

export default {
    root: resolve(globalConfig["appData"], "http"),
    version: "1.21.0",
    vhosts: resolve(globalConfig["appData"], "vhosts"),
    streams: resolve(globalConfig["appData"], "streams"),
    webroot: resolve(globalConfig["appData"], "http/html"),
};
