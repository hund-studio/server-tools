import { executeCommand } from "../utils/executeCommand";

export const detectGlobalNginx = async () => {
	try {
		await executeCommand("nginx -v");
		return true;
	} catch (error) {
		return false;
	}
};
