import { join } from "path";
import { rmSync } from "fs";
import nginxConfig from "../utils/config/nginx";

export const deleteStream = async (external: string) => {
    try {
        const filePath = join(nginxConfig["streams"], `${external}.conf`);
        rmSync(filePath);
        return true;
    } catch (error) {
        if (error instanceof Error) {
            return error["message"];
        } else {
            return false;
        }
    }
};
