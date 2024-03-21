import { getAsset } from "node:sea";
import { join, resolve } from "path";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import certbotConfig from "../utils/config/certbot";
import format from "string-template";
import nginxConfig from "../utils/config/nginx";

export const addVHost = async (
	domain: string,
	template = "default",
	port = "",
	root = "html",
	ssl = false
) => {
	try {
		const content = (() => {
			try {
				return readFileSync(
					resolve(__dirname, "templates", `${template}${ssl ? "--ssl" : ""}.txt`),
					"utf-8"
				);
			} catch (error) {
				return getAsset(`${template}${ssl ? "--ssl" : ""}.txt`, "utf-8");
			}
		})();
		mkdirSync(nginxConfig["vhosts"], { recursive: true });
		const filePath = join(nginxConfig["vhosts"], `${domain}.conf`);
		writeFileSync(filePath, format(content, { domain, port, sslDir: certbotConfig["root"], root }));
		return true;
	} catch (error) {
		if (error instanceof Error) {
			return error["message"];
		} else {
			return false;
		}
	}
};
