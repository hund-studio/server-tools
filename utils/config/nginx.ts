import { resolve } from "path";
import globalConfig from "./global";

export default {
	config: resolve(globalConfig["appData"], "config"),
	path: resolve(globalConfig["appData"], "server"),
	root: resolve(globalConfig["appData"], "server/html"),
	source: resolve(process.cwd(), "resources/nginx-1.21.0"),
};
