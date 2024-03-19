# Server Tools

This repository contains a set of useful production and development tools to easily configure a VPS server. Available tools are:

- Nginx manager
  - Install and start and nginx instance
  - Add VHosts with different templates (html, next.js reverse proxy...)
  - Automatically generate SSL Certificates using letsencrypt
- SSH2 Server + Client
  - Create SSH tunnel to serve local applications
  - Serve local applications on `https://`

Upcoming features are:

- Automate node application build on Github push

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

### SS2 Server

#### Start

To start an SSH2 server.
Valid arguments are:

| Arg | Description                                    | Required | Default |
| :-- | :--------------------------------------------- | :------- | :------ |
| -u  | User:Password combination to access the server | `TRUE`   | `-`     |
| -p  | Port for the SSH2 server                       | `FALSE`  | `4444`  |

##### SSH2 Server start examples

Start an SSH2 server on port 4242.

```bash
npm run ssh2:start -- -u george:1a2b3c4d -p 4242
```

Start an SSH2 server on port 4242.

```bash
npm run ssh2:start -- -u george:1a2b3c4d -p 4242
```

### SSH2 Tunnel

#### SSH2 Tunnel start

To start an SSH2 server.
Valid arguments are:

| Arg | Description                                    | Required | Default |
| :-- | :--------------------------------------------- | :------- | :------ |
|     | LocalPort:RemoteSSHHost:RemoteSSHHostPort      | `TRUE`   | `-`     |
| -u  | User:Password combination to access the server | `TRUE`   | `-`     |
| -p  | Remote target port                             | `FALSE`  | `0`     |
| -d  | Domain to use for public access                | `FALSE`  | `-`     |

##### SSH2 Server tunnel examples

Start an SSH2 tunnel of local port `3000`:

```bash
npm run ssh2:tunnel 3000:127.0.0.1:4242 -- -u george:1a2b3c4d -p 3000
```

Start an SSH2 tunnel of local port `3000` on domain `https://sample.hund.studio`:

```bash
npm run ssh2:tunnel 3000:127.0.0.1:4242 -- -p 3000 -d sample.hund.studio
```
