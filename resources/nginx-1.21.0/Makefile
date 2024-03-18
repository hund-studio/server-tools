
default:	build

clean:
	rm -rf Makefile objs

.PHONY:	default clean

build:
	$(MAKE) -f objs/Makefile

install:
	$(MAKE) -f objs/Makefile install

modules:
	$(MAKE) -f objs/Makefile modules

upgrade:
	/home/ubuntu/.nginx-manager/server/sbin/nginx -t

	kill -USR2 `cat /home/ubuntu/.nginx-manager/server/logs/nginx.pid`
	sleep 1
	test -f /home/ubuntu/.nginx-manager/server/logs/nginx.pid.oldbin

	kill -QUIT `cat /home/ubuntu/.nginx-manager/server/logs/nginx.pid.oldbin`

.PHONY:	build install modules upgrade
