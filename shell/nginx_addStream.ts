import { getAsset } from "node:sea";
import { join, resolve } from "path";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import format from "string-template";
import nginxConfig from "../utils/config/nginx";

export const addStream = async (external: string, internal: string) => {
    try {
        const content = (() => {
            try {
                return readFileSync(resolve(__dirname, "templates", "tcp.txt"), "utf-8");
            } catch (error) {
                return getAsset("tcp.txt", "utf-8");
            }
        })();
        mkdirSync(nginxConfig["streams"], { recursive: true });
        const filePath = join(nginxConfig["streams"], `${external}.conf`);
        writeFileSync(filePath, format(content, { external, internal }));
        return true;
    } catch (error) {
        if (error instanceof Error) {
            return error["message"];
        } else {
            return false;
        }
    }
};
