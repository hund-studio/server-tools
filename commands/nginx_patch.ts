import { appendFileSync, readFileSync, writeFileSync } from "fs";
import nginxConfig from "../utils/config/nginx";
import { resolve } from "path";
import { userInfo } from "os";
import format from "string-template";

export const patchNginx = async () => {
	try {
		const configFile = resolve(nginxConfig["path"], "conf/nginx.conf");
		const customConfigLocationString = `include ${nginxConfig["config"]}/*.conf;`;
		const serverUserString = `user ${userInfo().username};`;

		const content = readFileSync(resolve(process.cwd(), "templates", `patched.txt`), "utf-8");

		writeFileSync(
			configFile,
			format(content, { user: serverUserString, customConfig: customConfigLocationString })
		);
		return true;
	} catch (error) {
		if (error instanceof Error) {
			return error["message"];
		} else {
			return false;
		}
	}
};
