import { executeCommand } from "../utils/executeCommand";
import { mkdirSync } from "fs";
import { resolve } from "path";
import globalConfig from "../utils/config/global";
import nginxConfig from "../utils/config/nginx";

export const installNginx = async () => {
	try {
		mkdirSync(globalConfig["sources"], { recursive: true });

		const nginxSourcesFile = resolve(
			globalConfig["sources"],
			`nginx-${nginxConfig["version"]}.tar.gz`
		);
		await executeCommand(
			`curl -o ${nginxSourcesFile} https://nginx.org/download/nginx-${nginxConfig["version"]}.tar.gz`
		);

		await executeCommand(`tar -xzf ${nginxSourcesFile} -C ${globalConfig["sources"]}`);

		const nginxSourcesPath = resolve(globalConfig["sources"], `nginx-${nginxConfig["version"]}`);

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
