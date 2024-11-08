import { join } from "path";
import sshConfig from "../../utils/config/ssh";
import { accessSync, constants } from "fs";
import { executeCommand } from "../../utils/executeCommand";

export const detectLocalSSH = async () => {
    const sshExecutablePath = join(sshConfig["root"], "sbin", "sshd");

    try {
        accessSync(sshExecutablePath, constants.X_OK);
        await executeCommand(`${sshExecutablePath} -v`);
        return true;
    } catch (error) {
        return false;
    }
};
