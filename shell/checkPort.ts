import { executeCommand } from "../utils/executeCommand";

export const checkPort = async (port: number): Promise<boolean> => {
    try {
        const result = await executeCommand(`lsof -i :${port}`);
        return result.includes(`:${port}`);
    } catch {
        return false;
    }
};
