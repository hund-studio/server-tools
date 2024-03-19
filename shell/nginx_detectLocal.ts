import { join } from "path";
import nginxConfig from "../utils/config/nginx";
import { accessSync, constants } from "fs";
import { executeCommand } from "../utils/executeCommand";

export const detectLocalNginx = async () => {
	const nginxExecutablePath = join(nginxConfig["path"], "sbin", "nginx");

	try {
		accessSync(nginxExecutablePath, constants["X_OK"]);
		await executeCommand(`${nginxExecutablePath} -v`);
		return true;
	} catch (error) {
		return false;
	}
};
