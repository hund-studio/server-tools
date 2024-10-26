import { getAsset } from "node:sea";
import { join, resolve } from "path";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import certbotConfig from "../utils/config/certbot";
import format from "string-template";
import nginxConfig from "../utils/config/nginx";

export const addVHost = async (
    domain: string,
    template = "default",
    port = "",
    webroot = "html",
    ssl = false,
    redirects: string[] = []
) => {
    try {
        let content = (() => {
            const vHostTemplate = (() => {
                try {
                    return readFileSync(
                        resolve(__dirname, "templates", `${template}${ssl ? "--ssl" : ""}.txt`),
                        "utf-8"
                    );
                } catch (error) {
                    return getAsset(`${template}${ssl ? "--ssl" : ""}.txt`, "utf-8");
                }
            })();

            return format(vHostTemplate, { domain, port, sslDir: certbotConfig["root"], webroot });
        })();

        if (!!redirects["length"]) {
            const redirectTemplate = (() => {
                try {
                    return readFileSync(
                        resolve(
                            __dirname,
                            "templates",
                            "fragments",
                            `redirect${ssl ? "--ssl" : ""}.txt`
                        ),
                        "utf-8"
                    );
                } catch (error) {
                    return getAsset(
                        `templates/fragments/redirect${ssl ? "--ssl" : ""}.txt`,
                        "utf-8"
                    );
                }
            })();

            for (const redirectDomain of redirects) {
                content +=
                    "\n" +
                    format(redirectTemplate, {
                        domain,
                        sslDir: certbotConfig["root"],
                        redirectDomain,
                    });
            }
        }

        mkdirSync(nginxConfig["vhosts"], { recursive: true });
        const filePath = join(nginxConfig["vhosts"], `${domain}.conf`);
        writeFileSync(filePath, content);

        return true;
    } catch (error) {
        if (error instanceof Error) {
            return error["message"];
        } else {
            return false;
        }
    }
};
