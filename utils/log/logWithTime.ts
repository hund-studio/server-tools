const logPrefixes = {
    error: "[Error]",
    warn: "[Warn ]",
    info: "[Info ]",
    log: "[Log  ]",
};

const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

export const logWithTime = (
    type: keyof typeof logPrefixes,
    message?: any,
    ...optionalParams: any[]
) => console.log(logPrefixes[type], `[${formatDate(new Date())}]`, message, ...optionalParams);
