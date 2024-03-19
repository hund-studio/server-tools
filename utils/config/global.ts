import { homedir } from "os";
import { resolve } from "path";

export default {
	appData: resolve(homedir(), ".server-tools"),
};
