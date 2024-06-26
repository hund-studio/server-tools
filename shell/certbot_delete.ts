import { executeCommand } from "../utils/executeCommand";
import certbotConfig from "../utils/config/certbot";

export const deleteCert = async (domain: string) => {
	try {
		await executeCommand(
			`certbot delete --cert-name ${domain} --work-dir ${certbotConfig["work"]} --logs-dir ${certbotConfig["logs"]} --config-dir ${certbotConfig["root"]} --non-interactive`
		);
	} catch (error) {
		if (error instanceof Error) {
			return error["message"];
		} else {
			return false;
		}
	}
};
