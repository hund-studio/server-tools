import chalk from "chalk";
import { detectGlobalNginx } from "../shell/nginx_detectGlobal";
import { installNginx } from "../shell/nginx_install";
import { detectLocalNginx } from "../shell/nginx_detectLocal";
import { startNginx } from "../shell/nginx_start";
import { stopNginx } from "../shell/nginx_stop";
import { patchNginx } from "../shell/nginx_patch";

export const nginx_start = async () => {
    /* */
    console.log(chalk.magentaBright("=== START ==="));

    /* */
    console.log(chalk.greenBright("Trying to stop running nginx instances..."));
    await stopNginx();

    /* */
    console.log(chalk.greenBright("Checking for existing Nginx install..."));
    const foundGlobalInstall = await detectGlobalNginx();
    const foundLocalInstall = await detectLocalNginx();
    if (foundGlobalInstall) {
        console.log(
            chalk.greenBright(
                "Global Nginx version found, you should not use this tool on a machine with a global Nginx version installed."
            )
        );
    } else {
        if (foundLocalInstall) {
            console.log(
                chalk.greenBright("Local Nginx version found, no install will be performed.")
            );
        } else {
            /* */
            console.log(chalk.greenBright("Installing a local version of Nginx..."));
            const installresult = await installNginx();
            if (installresult !== true) {
                if (typeof installresult === "string") {
                    console.log(chalk.red(installresult));
                }
                console.log(chalk.redBright("Error during Nginx installation."));
                process.exit(0);
            } else {
                console.log(chalk.greenBright("Nginx successfully installed."));
            }
        }

        /* */
        console.log(chalk.greenBright("Patching default Nginx configuration..."));
        const patchedNginx = await patchNginx();
        if (patchedNginx !== true) {
            if (typeof patchedNginx === "string") {
                console.log(chalk.red(patchedNginx));
            }
            console.log(chalk.redBright("Error during Nginx patch."));
            process.exit(0);
        } else {
            console.log(chalk.greenBright("Nginx successfully patched."));
        }

        /* */
        console.log(chalk.greenBright("Starting the local version of Nginx..."));
        const nginxStarted = await startNginx();
        if (nginxStarted !== true) {
            if (typeof nginxStarted === "string") {
                console.log(chalk.red(nginxStarted));
            }
            console.log(chalk.redBright("Error during Nginx start."));
            process.exit(0);
        } else {
            console.log(chalk.greenBright("Nginx successfully started."));
        }
    }

    /* */
    console.log(chalk.magentaBright("=== END ==="));
};
