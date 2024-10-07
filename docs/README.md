# Server Tools

This repository contains a set of useful production and development tools to easily configure a VPS server.
Below a list of functionalities.

## Available functionalities

Find below a list of available/on progress/planned functionalities.

### Nginx administration

| Functionality                         | Status |
| :------------------------------------ | :----- |
| Start an Nginx server                 | ✅     |
| Add vhosts with different templates   | ✅     |
| Automatically handle SSL certificates | ✅     |

### SSH tunnels

| Functionality                                  | Status |
| :--------------------------------------------- | :----- |
| Start an SSH tunnel server on your VPS         | ✅     |
| Share local applications using prot forwarding | ✅     |
| Serve forwarded applications usnder `https`    | ✅     |

### Github autodeply

| Functionality                                    | Status |
| :----------------------------------------------- | :----- |
| Automate Node.js build and deploy on github push | ❌     |

### Random Nice To Have features

| Functionality                                                   | Status |
| :-------------------------------------------------------------- | :----- |
| Check id domain DNS are correct before issuing SSL cert         | ❌     |
| Add custom HTML error pages for paused/non-working applications | ❌     |

### Known issues

| Functionality                                                              | Status           |
| :------------------------------------------------------------------------- | :--------------- |
| If a vhost exists, it should be reset before requesting an SSL certificate | Solved in latest |

## Installation

This tool can be installed in two ways:

-   Cloning the repository and run it as a Node.js CLI tool (Node.js must be installed beforehand)
-   Using the prebuilt executable (No need to install Node.js beforehand)

Depending on which method you pick CLI tool should be used in a different way.

### Clone the repository

To clone you can simply run:

```bash
git clone https://github.com/hund-studio/server-tools.git
```

To run the CLI tool you have two choices:

-   Using `ts-node` to directly run the `cli.ts` file:

```bash
npx ts-node cli.ts
```

-   Create a js bundle with webpack `npx webpack` and run the budnled output:

```bash
node dist/cli.js
```

### Download the executable

Download the latest executable version from the Repository "releases" page.

To run the CLI executable you must add run permissions on file:

```bash
chmod +x server-tools
```

the you can run it from anywhere as a normal program

```bash
./server-tools
```

## Nginx manager

### Prerequisites

-   ⚠️ This tool must be run from a sudo-privileged user due to Nginx limitations.
    -   On Ubuntu 24.04 LTS sudo seems no longer required.
-   ⚠️ This functionality has only been tested on Ubuntu.

#### Required deps

When using the Nginx `start` command you might need the following dependencies in order to compile it from source.

```bash
sudo apt update -y && sudo apt-get install git build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev libgd-dev libxml2 libxml2-dev uuid-dev
```

### Install and Start

When starting the server a procedure will check if there is need to install Nginx and other required tools.

```bash
./server-tools nginx:start
```

### Stop

Stop the Nginx server.

```bash
./server-tools nginx:stop
```

### Add

Add command can be used to add an Nginx vhost with some premade templates.
Valid arguments are:

| Arg | Description                          | Required | Default   |
| :-- | :----------------------------------- | :------- | :-------- |
|     | domain for the vhost                 | `TRUE`   | `-`       |
| -t  | Template name that you want to use   | `FALSE`  | `default` |
| -p  | Port if template supports it         | `FALSE`  | `-`       |
| -r  | Webroot path if template supports it | `FALSE`  | `html`    |

#### Examples

Add a vhost to reverse proxy a next.js application running on port `3001` to domain `http://sample.hund.studio`.

```bash
./server-tools nginx:add sample.hund.studio -t next-js -p 3001
```

Add a vhost to serve files inside `/home/ubuntu/sample.hund.studio` on `https://sample.hund.studio`

```bash
./server-tools  nginx:add sample.hund.studio -r /home/ubuntu/sample.hund.studio
```

### SSL Certificate

You need to install `certbot` on you server with `snap`.

> certbot-auto script has been deprecated and `snap` is the suggested install method.

```bash
sudo snap install --classic certbot
```

When installed Certifcate creation will be automatically handled on vhost setup.

## SSH2

### SSH2 Server

This SSH2 server is ready to handle local port forwarding and should be used in combination with `ssh2:tunnel` command.

#### SSH2 Server Start

To start an SSH2 server.
Valid arguments are:

| Arg | Description                                        | Required | Default |
| :-- | :------------------------------------------------- | :------- | :------ |
| -u  | `user`:`password` combination to access the server | `TRUE`   | `-`     |
| -p  | Port for the SSH2 server                           | `FALSE`  | `4444`  |

##### SSH2 Server start examples

Start an SSH2 server on port `4242`:

```bash
./server-tools ssh2:start -u george:1a2b3c4d -p 4242
```

### SSH2 Tunnel

#### SSH2 Tunnel start

To start an SSH2 server.
Valid arguments are:

| Arg | Description                                        | Required | Default |
| :-- | :------------------------------------------------- | :------- | :------ |
|     | `localPort`:`remoteSSHHost`:`remoteSSHHostPort`    | `TRUE`   | `-`     |
| -u  | `user`:`password` combination to access the server | `TRUE`   | `-`     |
| -p  | Remote target port                                 | `FALSE`  | `0`     |
| -e  | External target port to expose using stream        | `FALSE`  | `-`     |
| -d  | Domain to use for public access                    | `FALSE`  | `-`     |

##### SSH2 Server tunnel examples

Start an SSH2 tunnel of local port `3000` on remote port `4545` (if available):

```bash
./server-tools ssh2:tunnel 3000:127.0.0.1:4242 -- -u george:1a2b3c4d -p 4545
```

Start an SSH2 tunnel of local port `3000` on domain `http(s)://sample.hund.studio`:

```bash
./server-tools ssh2:tunnel 3000:127.0.0.1:4242 -- -p 3000 -d sample.hund.studio
```

## How to build the executable

Preparing executalbe files in Node it is still an experimental practice. You can prepare the executable with the npm script:

```
npm run pkg
```

...that will execute a pkg.sh file to generate a Linux-ready executable (MacOS and Win versions of the script are not yet available).
More information about this topic can be found at the following links:

-   [dev.to article](https://dev.to/chad_r_stewart/compile-a-single-executable-from-your-node-app-with-nodejs-20-and-esbuild-210j)
-   [Node.js API doc](https://nodejs.org/api/single-executable-applications.html#single-executable-application-creation-process)
-   [Node.js 21.7.0 release](https://nodejs.org/en/blog/release/v21.7.0)
-   [nodejs github repository about single-executables state of the art](https://github.com/nodejs/single-executable)
