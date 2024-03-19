import { join, resolve } from "path";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import nginxConfig from "../utils/config/nginx";
import format from "string-template";
import certbotConfig from "../utils/config/certbot";

export const addVHost = async (
	domain: string,
	template = "default",
	port = "",
	root = "html",
	ssl = false
) => {
	try {
		const content = readFileSync(
			resolve(process.cwd(), "templates", `${template}${ssl ? "--ssl" : ""}.txt`),
			"utf-8"
		);
		mkdirSync(nginxConfig["config"], { recursive: true });
		const filePath = join(nginxConfig["config"], `${domain}.conf`);
		writeFileSync(
			filePath,
			format(content, { domain, port, sslDir: certbotConfig["config"], root })
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
