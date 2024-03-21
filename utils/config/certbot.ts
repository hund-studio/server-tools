import { resolve } from "path";
import globalConfig from "./global";

export default {
	logs: resolve(globalConfig["appData"], "ssl/logs"),
	root: resolve(globalConfig["appData"], "ssl"),
	work: resolve(globalConfig["appData"], "ssl/work"),
};
