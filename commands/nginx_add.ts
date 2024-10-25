import { addVHost } from "../shell/nginx_addVHost";
import { deleteCert } from "../shell/certbot_delete";
import { deleteVHost } from "../shell/nginx_deleteVHost";
import { issueCert } from "../shell/certbot_issue";
import { reloadNginx } from "../shell/nginx_reload";
import chalk from "chalk";

export const nginx_add = async (
    domain: string,
    options: { template?: string; port?: number | string; webroot?: string; redirects?: string[] }
) => {
    /* */
    console.log(chalk.magentaBright("=== START ==="));

    const domainsToHandle = [domain, ...(options["redirects"] || [])];

    /* */
    for (const domain of domainsToHandle) {
        await deleteVHost(domain);
        await deleteCert(domain);
    }

    await reloadNginx();

    /* */
    console.log(chalk.greenBright(`Trying issuing certificate for ${domain}...`));
    const isIssued = await (async () => {
        let issued: string | boolean = true;
        for (const domain of domainsToHandle) {
            issued = await issueCert(domain);
            if (issued !== true) {
                break;
            }
        }
        return issued;
    })();

    if (isIssued !== true) {
        if (typeof isIssued === "string") {
            console.log(chalk.red(isIssued));
        }
        console.log(chalk.redBright("SSL Certificate is not available, https won't be available."));
    } else {
        console.log(chalk.greenBright("SSL Certificate successfully generated."));
    }

    /* */
    console.log(chalk.greenBright(`Adding ${domain} to virtual hosts...`));
    const createdVHost = await addVHost(
        domain,
        options["template"],
        String(options["port"]),
        options["webroot"],
        isIssued === true,
        options["redirects"]
    );

    if (createdVHost !== true) {
        if (typeof createdVHost === "string") {
            console.log(chalk.red(createdVHost));
        }
        console.log(chalk.redBright("Error during Nginx virtual host creation."));
        process.exit(0);
    } else {
        console.log(chalk.greenBright("Nginx virtual host successfully created."));
    }

    /* */
    console.log(chalk.greenBright("Reloading Nginx service..."));
    await reloadNginx();

    /* */
    console.log(chalk.magentaBright("=== END ==="));
};
