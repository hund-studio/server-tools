import { executeCommand } from "../../utils/executeCommand";
import { mkdirSync } from "fs";
import { resolve } from "path";
import globalConfig from "../../utils/config/global";
import sshConfig from "../../utils/config/ssh";

export const installSSH = async () => {
    try {
        mkdirSync(globalConfig["sources"], { recursive: true });

        const sshSourcesFile = resolve(
            globalConfig["sources"],
            `openssh-${sshConfig["version"]}.tar.gz`
        );
        await executeCommand(
            `curl -o ${sshSourcesFile} https://cdn.openbsd.org/pub/OpenBSD/OpenSSH/portable/openssh-${sshConfig["version"]}.tar.gz`
        );

        await executeCommand(`tar -xzf ${sshSourcesFile} -C ${globalConfig["sources"]}`);

        const sshSourcesPath = resolve(globalConfig["sources"], `openssh-${sshConfig["version"]}`);

        await executeCommand(`./configure --prefix=${sshConfig["root"]}`, {
            cwd: sshSourcesPath,
        });
        await executeCommand("make", { cwd: sshSourcesPath });
        await executeCommand("make install", { cwd: sshSourcesPath });

        return true;
    } catch (error) {
        if (error instanceof Error) {
            return error["message"];
        } else {
            return false;
        }
    }
};
