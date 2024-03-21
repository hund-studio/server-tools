import { program } from "commander";
import { ssh2_start } from "./commands/ssh2_start";
import { nginx_start } from "./commands/nginx_start";
import { nginx_stop } from "./commands/nginx_stop";
import { nginx_add } from "./commands/nginx_add";
import { ssh2_tunnel } from "./commands/ssh2_tunnel";
import packageJson from "./package.json";

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
	.description("Stop the LOCAL Nginx server, it only work with Nginx server installed by this tool")
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
		"-r, --root <path>",
		"if template supports it, it can be used to specify the root path inside the template"
	)
	.action((domain, options) => {
		nginx_add(domain, {
			template: options["template"],
			port: options["port"],
			root: options["root"],
		});
	});

/**
 * SSH2 commands
 */

program
	.command("ssh2:start")
	.description("start an SSH2 server to handle reverse port forwarding")
	.requiredOption("-u, --user <user:password>", "user:password to access server")
	.option("-p, --port <number>", "SSH2 server port")
	.action((options) => {
		// Maybe some zod validation would be nice
		ssh2_start({ port: options["port"] && Number(options["port"]), user: options["user"] });
	});

program
	.command("ssh2:tunnel")
	.description("start an SSH2 tunnel")
	.argument("<connectionString>", "localport:sshhost:sshport")
	.requiredOption("-u, --user <user:password>", "user:password to access server")
	.option("-p, --port <number>", "public port to use on remote server")
	.option("-d, --domain <domain>", "public domain to use on remote server")
	.action((connectionString, options) => {
		ssh2_tunnel(connectionString, {
			user: options["user"],
			remotePort: options["port"] && Number(options["port"]),
			publicDomain: options["domain"],
		});
	});

program.parse();
