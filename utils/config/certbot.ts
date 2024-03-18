import { homedir } from "os";
import { resolve } from "path";

export default {
	work: resolve(homedir(), ".nginx-manager/ssl/work"),
	logs: resolve(homedir(), ".nginx-manager/ssl/logs"),
	config: resolve(homedir(), ".nginx-manager/ssl"),
	email: "developer@hund.studio",
};
