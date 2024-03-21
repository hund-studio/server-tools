import { resolve } from "path";
import certbotConfig from "../utils/config/certbot";
import nginxConfig from "../utils/config/nginx";
import { executeCommand } from "../utils/executeCommand";
import { accessSync, existsSync, readdirSync } from "fs";
import globalConfig from "../utils/config/global";

export const issueCert = async (domain: string) => {
	try {
		await executeCommand(
			`certbot certonly --webroot --webroot-path ${nginxConfig["webroot"]} --cert-name ${domain} --work-dir ${certbotConfig["work"]} --logs-dir ${certbotConfig["logs"]} --config-dir ${certbotConfig["root"]} --non-interactive --agree-tos -m ${globalConfig["email"]} -d ${domain}`
		);

		const certificatesDir = resolve(certbotConfig["root"], "live");

		if (!existsSync(certificatesDir)) {
			throw new Error("`live` folder not found");
		}

		const [directory] = readdirSync(certificatesDir, {
			withFileTypes: true,
		})
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)
			.filter((dirname) => dirname.split("-")[0] === domain);

		const domainCertificateDir = resolve(certificatesDir, directory);

		if (!existsSync(domainCertificateDir)) {
			throw new Error("`domain` certificate dir not found");
		}

		if (!existsSync(resolve(domainCertificateDir, "fullchain.pem"))) {
			throw new Error("`fullchain.pem` certificate not found");
		}

		if (!existsSync(resolve(domainCertificateDir, "privkey.pem"))) {
			throw new Error("`privkey.pem` certificate not found");
		}

		try {
			accessSync(`${certbotConfig["root"]}/dhparam.pem`);
		} catch (e) {
			await executeCommand(`openssl dhparam -out ${certbotConfig["root"]}/dhparam.pem 2048`);
		}

		return true;
	} catch (error) {
		if (error instanceof Error) {
			return error["message"];
		} else {
			return false;
		}
	}
};
