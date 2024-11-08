import chalk from "chalk";
import { stop } from "../shell/openssh/stop";
import { detectLocalSSH } from "../shell/openssh/detectLocal";
import { installSSH } from "../shell/openssh/install";
import { start } from "../shell/openssh/start";

const PORT = 4242;

export const ssh_start = async () => {
    /* */
    console.log(chalk.magentaBright("=== START ==="));

    /* */
    console.log(chalk.greenBright("Trying to stop running OpenSSH instances..."));
    await stop(PORT);

    /* */
    console.log(chalk.greenBright("Checking for existing OpenSSH install..."));
    const foundLocalInstall = await detectLocalSSH();
    if (foundLocalInstall) {
        console.log(
            chalk.greenBright("Local OpenSSH version found, no install will be performed.")
        );
    } else {
        /* */
        console.log(chalk.greenBright("Installing a local version of OpenSSH..."));
        const installresult = await installSSH();
        if (installresult !== true) {
            if (typeof installresult === "string") {
                console.log(chalk.red(installresult));
            }
            console.log(chalk.redBright("Error during OpenSSH installation."));
            process.exit(0);
        } else {
            console.log(chalk.greenBright("OpenSSH successfully installed."));
        }

        /* */
        console.log(chalk.greenBright("Starting the local version of OpenSSH..."));
        const started = await start(PORT);
        if (started !== true) {
            if (typeof started === "string") {
                console.log(chalk.red(started));
            }
            console.log(chalk.redBright("Error during OpenSSH start."));
            process.exit(0);
        } else {
            console.log(chalk.greenBright("OpenSSH successfully started."));
        }
    }

    /* */
    console.log(chalk.magentaBright("=== END ==="));
};
