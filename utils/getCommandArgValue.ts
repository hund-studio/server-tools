export const getCommandArgValue = (args: string[], argument: string) => {
	const index = args.findIndex(
		(value, index, array) => value === argument && index < array.length - 1
	);
	return index !== -1 ? args[index + 1] : undefined;
};
