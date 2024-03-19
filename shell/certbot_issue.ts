import { resolve } from "path";
import certbotConfig from "../utils/config/certbot";
import nginxConfig from "../utils/config/nginx";
import { executeCommand } from "../utils/executeCommand";
import { accessSync, existsSync, readdirSync } from "fs";

export const issueCert = async (domain: string) => {
	try {
		await executeCommand(
			`certbot certonly --webroot --webroot-path ${nginxConfig["root"]} --cert-name ${domain} --work-dir ${certbotConfig["work"]} --logs-dir ${certbotConfig["logs"]} --config-dir ${certbotConfig["config"]} --non-interactive --agree-tos -m ${certbotConfig["email"]} -d ${domain}`
		);

		const certificatesDir = resolve(certbotConfig["config"], "live");

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
			accessSync(`${certbotConfig["config"]}/dhparam.pem`);
		} catch (e) {
			await executeCommand(`openssl dhparam -out ${certbotConfig["config"]}/dhparam.pem 2048`);
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
