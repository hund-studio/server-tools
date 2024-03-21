import { readFileSync, writeFileSync } from "fs";
import { getAsset } from "node:sea";
import { resolve } from "path";
import { userInfo } from "os";
import format from "string-template";
import nginxConfig from "../utils/config/nginx";

export const patchNginx = async () => {
	try {
		const configFile = resolve(nginxConfig["root"], "conf/nginx.conf");
		const customConfigLocationString = `include ${nginxConfig["vhosts"]}/*.conf;`;
		const serverUserString = `user ${userInfo().username};`;

		const content = (() => {
			try {
				return readFileSync(resolve(__dirname, "templates", "patched.txt"), "utf-8");
			} catch (error) {
				return getAsset("patched.txt", "utf-8");
			}
		})();

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
