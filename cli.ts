import { getWorkerFile } from "./utils/getWorkerFile";
import { nginx_add } from "./commands/nginx_add";
import { nginx_start } from "./commands/nginx_start";
import { nginx_stop } from "./commands/nginx_stop";
import { program } from "commander";
import { ssh_start } from "./commands/ssh_start";
import { Worker } from "worker_threads";
import chalk from "chalk";
import packageJson from "./package.json";
import z from "zod";

program
    .name(packageJson["name"])
    .description(packageJson["description"])
    .version(packageJson["version"]);

/**
 * NGINX commands
 */

program
    .command("nginx:start")
    .description("Start a LOCAL Nginx server, if not present it will be installed")
    .action(() => {
        nginx_start();
    });

program
    .command("nginx:stop")
    .description(
        "Stop the LOCAL Nginx server, it only work with Nginx server installed by this tool"
    )
    .action(() => {
        nginx_stop();
    });

program
    .command("nginx:add")
    .description("Add a new vhost to LOCAL Nginx configuration")
    .argument("<domain>", "target domain to add")
    .option("-t, --template <name>", "template to use while creating the vhost")
    .option(
        "-p, --port <number>",
        "if template supports it, it can be used to specify a port inside the template (ae. reverse proxies)"
    )
    .option(
        "-d, --webroot <path>",
        "if template supports it, it can be used to specify the web root path inside the template"
    )
    .option(
        "-r, --redirect <redirectDomain>",
        "specify a domain to redirect to (e.g., redirect from www to non-www or vice versa)"
    )
    .action((domain, options) => {
        if (["next-js", "nodejs", "websocket"].includes(options["template"]) && !options["port"]) {
            console.error(
                `Error: --port is mandatory when --template is set to ${options["template"]}`
            );
            process.exit(1);
        }

        nginx_add(domain, {
            template: options["template"],
            port: options["port"],
            webroot: options["webroot"],
            redirects: options["redirect"].split(" "),
        });
    });

/**
 * SSH2 commands
 */

program
    .command("ssh:start")
    .description("Start an SSH server to handle reverse port forwarding")
    .requiredOption(
        "-u, --user <user:password>",
        "User credentials in the format user:password for SSH server access"
    )
    .option("-p, --port <port>", "Port for the SSH server (default is 22)")
    .option("-v, --verbose", "Enable verbose logging")
    .action((options) => {
        const schema = z.object({
            user: z.string().regex(/^[^:]+:[^:]+$/, "Invalid format for user:password"),
            port: z
                .string()
                .optional()
                .transform((port) => (port ? Number(port) : 22))
                .refine((port) => port > 0 && port < 65536, {
                    message: "Port must be a valid number between 1 and 65535",
                }),
            verbose: z.boolean().optional(),
        });

        const validationResult = schema.safeParse(options);
        if (!validationResult["success"]) {
            console.error(
                chalk.redBright("Validation failed:", validationResult["error"]["errors"])
            );
            process.exit(1);
        }

        // ssh2_start({
        //     port: validationResult["data"]["port"],
        //     user: validationResult["data"]["user"],
        //     verbose: validationResult["data"]["verbose"] || false,
        // });

        ssh_start();
    });

program
    .command("ssh:tunnel")
    .description("Start an SSH tunnel from your local port to a remote SSH server")
    .argument("<connectionString>", "Specify in the format: localport:sshhost:sshport")
    .requiredOption(
        "-u, --user <user:password>",
        "User credentials in the format user:password for remote SSH access"
    )
    .option("-d, --domain <domain>", "Public domain name to bind on the remote server")
    .option("-p, --port <remotePort>", "Remote port the SSH server should use")
    .option("-s, --stream <port>", "Port number to use as a streaming proxy")
    .option("-v, --verbose", "Enable verbose logging")
    .action((connectionString, options) => {
        const workerFile = getWorkerFile("workers/ssh_tunnel.js");
        const worker = new Worker(workerFile);

        worker.postMessage({
            connectionString,
            options: {
                externalPort: options["external"] && Number(options["external"]),
                publicDomain: options["domain"],
                remotePort: options["port"] && Number(options["port"]),
                user: options["user"],
                verbose: options["verbose"] || false,
            },
        });

        worker.on("message", (message) => {
            console.log(`Worker message: ${JSON.stringify(message)}`);
            if (message.status === "completed") {
                console.log("SSH tunnel operation completed");
            }
        });

        worker.on("error", (err) => {
            console.error("Worker encountered an error:", err);
        });

        worker.on("exit", (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            } else {
                console.log("Worker exited successfully");
            }
        });
    });

program
    .command("ssh:tunnel:examples")
    .description("Show usage examples for the ssh:tunnel command")
    .action(() => {
        console.log(`
Usage Examples:

1.  Basic tunnel setup from local port 3000 to remote SSH server:
    ${chalk.greenBright("ssh:tunnel 3000:remotehost.com:22 -u username:password")}

2.  Tunnel with a specific public domain and remote port:
    ${chalk.greenBright(
        "ssh:tunnel 3000:remotehost.com:22 -u username:password -d example.com -p 2222"
    )}

3.  Tunnel with a streaming proxy on port 25565:
    ${chalk.greenBright("ssh:tunnel 25565:remotehost.com:22 -u username:password -s 25565")}

4.  Tunnel with verbose logging enabled:
    ${chalk.greenBright("ssh:tunnel 3000:remotehost.com:22 -u username:password -v")}

5.  Tunnel using a non-default SSH port (e.g., 4242 instead of 22):
    ${chalk.greenBright("ssh:tunnel 3000:remotehost.com:4242 -u username:password")}

${chalk.magentaBright(`Note:
- Make sure the <connectionString> follows the format: localport:sshhost:sshport
- Use the -v option to enable verbose output for debugging purposes.`)}
`);
    });

program.parse();
