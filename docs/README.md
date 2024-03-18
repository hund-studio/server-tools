# Prerequisites

This tool can be run only with a sudo-privileged user. Otherwise nginx wouldn't be able to access port 80.

# Required deps

You must install those deps in order to build NGINX.

```bash
sudo apt update -y && sudo apt-get install git build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev libgd-dev libxml2 libxml2-dev uuid-dev
```

# Install and run

When starting the server a procedure ill check if there is need to install nginx and other required tools.

```bash
npm run start
```

# Stop

```bash
npm run stop
```

# Add

Add command is useful to add vhosts with some premade templates. In order to pass arguments to npm run command you must use `--` before passing arugments.
Valid arguments are...

| Arg | Description                          |
| :-- | :----------------------------------- |
| -t  | Template name that you want to use   |
| -p  | Port if template supports it         |
| -r  | Webroot path if template supports it |

```bash
npm run add sample.hund.studio -- -t next-js
```

```bash
npm run add sample.hund.studio -- -r /home/ubuntu/sample.hund.studio
```

# SLL Certificate

First you need to install certbot too on you server using snap, since certbot-auto script has been deprecated.

```bash
sudo snap install --classic certbot
```

When you add a new website Certifcate creation ill be handled automatically.
