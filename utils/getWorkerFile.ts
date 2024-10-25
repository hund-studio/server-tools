import { basename, join } from "path";
import { writeFileSync } from "fs";
import os from "node:os";
import { getAsset } from "node:sea";

export function getWorkerFile(assetPath: string) {
    const workerCode = getAsset(assetPath, "utf-8");

    const tempDir = os.tmpdir();
    const tempFilePath = join(tempDir, basename(assetPath));

    writeFileSync(tempFilePath, workerCode, "utf-8");

    return tempFilePath;
}
