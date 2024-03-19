import { resolve } from "path";
import globalConfig from "./global";

export default {
	config: resolve(globalConfig["appData"], "ssl"),
	email: "developer@hund.studio",
	logs: resolve(globalConfig["appData"], "ssl/logs"),
	work: resolve(globalConfig["appData"], "ssl/work"),
};
