import { homedir } from "os";
import { resolve } from "path";

export default {
	source: resolve(process.cwd(), "resources/nginx-1.21.0"),
	path: resolve(homedir(), ".nginx-manager/server"),
	config: resolve(homedir(), ".nginx-manager/config"),
	root: resolve(homedir(), ".nginx-manager/server/html"),
};
