# Server Tools

This repository contains a set of useful production and development tools to easily configure a VPS server.

Available tools are:

- Nginx manager
  - Install and start an Nginx instance
  - Add vhosts with different templates (HTML, Next.js reverse proxy...)
  - Automatically generate SSL certificates using Let's Encrypt
- SSH2 Server + Client
  - Create SSH tunnel to serve local applications
  - Serve local applications on `https://`

Upcoming features are:

- Automate node application build/deploy on GitHub push using webhooks

Nice to have:

- Before issuing a certificate, it should check if DNS is pointed correctly
- In the future, the entire package could be bundled and distributed as a standalone command-line tool, eliminating the need to clone the repository
- A way to retrieve a specific Nginx source code version without adding it to the repository
- Some custom HTML messages/templates for default/non-working applications

Not on our list:

- A tool to run Node.js applications or similar. There are fantastic tools like PM2 which do that and it is not the goal of this repository.

## To fix

- If a vhost exists, it should be deleted before requesting an SSL certificate.

## Nginx manager

### Prerequisites

This tool can be run only with a sudo-privileged user, otherwise Nginx wouldn't be able to run on port 80. This repository has only been tested on Ubuntu.

#### Required deps

You must install the following dependencies to build Nginx from source.
Nginx build and installation will be handled from `start` command.

```bash
sudo apt update -y && sudo apt-get install git build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev libgd-dev libxml2 libxml2-dev uuid-dev
```

### Install and Start

When starting the server a procedure will check if there is need to install Nginx and other required tools.

```bash
npm run nginx:start
```

### Stop

Stop the Nginx server.

```bash
npm run nginx:stop
```

### Add

Add command can be used to add nginx VHosts with some premade templates. In order to pass arguments to `npm run` command you must use `--` before passing arugments.
Valid arguments are:

| Arg | Description                          | Required | Default   |
| :-- | :----------------------------------- | :------- | :-------- |
| -t  | Template name that you want to use   | `FALSE`  | `default` |
| -p  | Port if template supports it         | `FALSE`  | `-`       |
| -r  | Webroot path if template supports it | `FALSE`  | `html`    |

#### Examples

Add a VHost to reverse proxy a next.js application running on port `3001` to domain `http://sample.hund.studio`.

```bash
npm run nginx:add sample.hund.studio -- -t next-js -p 3001
```

Add a VHOST to serve files inside `/home/ubuntu/sample.hund.studio` on `https://sample.hund.studio`

```bash
npm run nginx:add sample.hund.studio -- -r /home/ubuntu/sample.hund.studio
```

### SSL Certificate

You need to install `certbot` on you server with `snap`.

> certbot-auto script has been deprecated and `snap` is the suggested install method.

```bash
sudo snap install --classic certbot
```

When installed Certifcate creation will be automatically handled on VHost setup.

## SSH2

### SSH2 Server

#### SSH2 Server Start

To start an SSH2 server.
Valid arguments are:

| Arg | Description                                        | Required | Default |
| :-- | :------------------------------------------------- | :------- | :------ |
| -u  | `User`:`Password` combination to access the server | `TRUE`   | `-`     |
| -p  | Port for the SSH2 server                           | `FALSE`  | `4444`  |

##### SSH2 Server Start using PM2

If you want to start it as a daemonized process the easiest way is to use PM2.

```bash
pm2 start "npm run ssh2:start -- -u george:1a2b3c4d -p 4242"
```

##### SSH2 Server start examples

Start an SSH2 server on port `4242`:

```bash
npm run ssh2:start -- -u george:1a2b3c4d -p 4242
```

### SSH2 Tunnel

#### SSH2 Tunnel start

To start an SSH2 server.
Valid arguments are:

| Arg | Description                                        | Required | Default |
| :-- | :------------------------------------------------- | :------- | :------ |
|     | `LocalPort`:`RemoteSSHHost`:`RemoteSSHHostPort`    | `TRUE`   | `-`     |
| -u  | `User`:`Password` combination to access the server | `TRUE`   | `-`     |
| -p  | Remote target port                                 | `FALSE`  | `0`     |
| -d  | Domain to use for public access                    | `FALSE`  | `-`     |

##### SSH2 Server tunnel examples

Start an SSH2 tunnel of local port `3000` on remote port `4545` (if available):

```bash
npm run ssh2:tunnel 3000:127.0.0.1:4242 -- -u george:1a2b3c4d -p 4545
```

Start an SSH2 tunnel of local port `3000` on domain `http(s)://sample.hund.studio`:

```bash
npm run ssh2:tunnel 3000:127.0.0.1:4242 -- -p 3000 -d sample.hund.studio
```

## Prepare the executable

This way of preparing the executable is experimental.

```bash
npm run bundle
```

```bash
node --experimental-sea-config seaconfig.json
cp $(command -v node) ./dist/server-tools
```

> https://dev.to/chad_r_stewart/compile-a-single-executable-from-your-node-app-with-nodejs-20-and-esbuild-210j

> https://nodejs.org/api/single-executable-applications.html#single-executable-application-creation-process

> https://nodejs.org/en/blog/release/v21.7.0

```bash
npx postject ./dist/server-tools NODE_SEA_BLOB ./dist/cli.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
```
