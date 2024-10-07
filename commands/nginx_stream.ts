import { addStream } from "../shell/nginx_addStream";
import { deleteStream } from "../shell/nginx_deleteStream";
import { reloadNginx } from "../shell/nginx_reload";
import chalk from "chalk";

export const nginx_stream = async (external: string, options: { port?: number | string }) => {
    /* */
    console.log(chalk.magentaBright("=== START ==="));

    /* */
    await deleteStream(external);
    await reloadNginx();

    /* */
    console.log(chalk.greenBright(`Adding ${external} to streams...`));
    const createdStream = await addStream(external, String(options["port"]));
    if (createdStream !== true) {
        if (typeof createdStream === "string") {
            console.log(chalk.red(createdStream));
        }
        console.log(chalk.redBright("Error during Nginx stream creation."));
        process.exit(0);
    } else {
        console.log(chalk.greenBright("Nginx stream successfully created."));
    }

    /* */
    console.log(chalk.greenBright("Reloading Nginx service..."));
    await reloadNginx();

    /* */
    console.log(chalk.magentaBright("=== END ==="));
};
