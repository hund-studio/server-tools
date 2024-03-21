import nginxConfig from "../utils/config/nginx";
import { executeCommand } from "../utils/executeCommand";

export const startNginx = async () => {
	try {
		const startCommand = `sudo ${nginxConfig["root"]}/sbin/nginx`;
		await executeCommand(startCommand);
		return true;
	} catch (error) {
		if (error instanceof Error) {
			return error["message"];
		} else {
			return false;
		}
	}
};
