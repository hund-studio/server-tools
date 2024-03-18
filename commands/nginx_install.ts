import { executeCommand } from "../utils/executeCommand";
import nginxConfig from "../utils/config/nginx";

export const installNginx = async () => {
	try {
		await executeCommand(`./configure --prefix=${nginxConfig["path"]} --with-http_ssl_module`, {
			cwd: nginxConfig["source"],
		});
		await executeCommand('make CFLAGS="-Wno-error=deprecated-declarations"', {
			cwd: nginxConfig["source"],
		});
		await executeCommand("make install", {
			cwd: nginxConfig["source"],
		});
		return true;
	} catch (error) {
		if (error instanceof Error) {
			return error["message"];
		} else {
			return false;
		}
	}
};
