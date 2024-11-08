import { executeCommand } from "../../utils/executeCommand";
import sshConfig from "../../utils/config/ssh";

export const start = async (port: number) => {
    try {
        await executeCommand(`sudo ${sshConfig["root"]}/sbin/sshd -p ${port}`);
        return true;
    } catch (error) {
        return error instanceof Error ? error.message : false;
    }
};
