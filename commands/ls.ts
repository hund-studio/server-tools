import { executeCommand } from "../utils/executeCommand";

export const ls = async () => {
	try {
		await executeCommand("ls");
		return true;
	} catch (error) {
		return false;
	}
};
