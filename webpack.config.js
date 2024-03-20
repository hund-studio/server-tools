const path = require("path");

module.exports = {
	entry: "./cli.ts",
	target: "node",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.(node)$/,
				loader: "node-loader",
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	output: {
		filename: "cli.js",
		path: path.resolve(__dirname, "dist"),
	},
};
