import nginxConfig from "../utils/config/nginx";
import { executeCommand } from "../utils/executeCommand";

export const stopNginx = async () => {
	try {
		const stopCommand = `sudo ${nginxConfig.path}/sbin/nginx -s stop`;
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
