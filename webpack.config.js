const path = require("path");

module.exports = {
    entry: { cli: "./cli.ts", "workers/ssh_tunnel": "./workers/ssh_tunnel.ts" },
    target: "node",
    mode: "production",
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
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    },
};
