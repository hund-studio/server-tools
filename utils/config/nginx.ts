import { resolve } from "path";
import globalConfig from "./global";

export default {
	root: resolve(globalConfig["appData"], "http"),
	version: "1.21.0",
	vhosts: resolve(globalConfig["appData"], "vhosts"),
	webroot: resolve(globalConfig["appData"], "html"),
};
