import { resolve } from "path";
import globalConfig from "./global";

export default {
	config: resolve(globalConfig["appData"], "ssh"),
};
