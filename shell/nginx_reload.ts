import nginxConfig from "../utils/config/nginx";
import { executeCommand } from "../utils/executeCommand";

export const reloadNginx = async () => {
	try {
		const stopCommand = `sudo ${nginxConfig["root"]}/sbin/nginx -s reload`;
		await executeCommand(stopCommand);
		return true;
	} catch (error) {
		if (error instanceof Error) {
			return error["message"];
		} else {
			return false;
		}
	}
};
