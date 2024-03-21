import { executeCommand } from "../utils/executeCommand";
import nginxConfig from "../utils/config/nginx";
import { resolve } from "path";
import globalConfig from "../utils/config/global";

export const installNginx = async () => {
	try {
		const nginxSourcesFile = resolve(
			globalConfig["sources"],
			`nginx-${nginxConfig["version"]}.tar.gz`
		);
		await executeCommand(
			`curl -o ${nginxSourcesFile} https://nginx.org/download/nginx-${nginxConfig["version"]}.tar.gz`
		);

		const nginxSourcesPath = resolve(globalConfig["sources"], `nginx-${nginxConfig["version"]}`);
		await executeCommand(`tar -xzf ${nginxSourcesFile} -C ${nginxSourcesPath}`);

		await executeCommand(`./configure --prefix=${nginxConfig["root"]} --with-http_ssl_module`, {
			cwd: nginxSourcesPath,
		});
		await executeCommand('make CFLAGS="-Wno-error=deprecated-declarations"', {
			cwd: nginxSourcesPath,
		});
		await executeCommand("make install", {
			cwd: nginxSourcesPath,
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
