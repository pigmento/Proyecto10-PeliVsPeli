FROM mysql:5.7.15

MAINTAINER Pablo Schonwiesner

ENV MYSQL_DATABASE=competencias \
	MYSQL_ROOT_PASSWORD=pass

ADD schema.sql /docker-entrypoint-initdb.d

EXPOSE 3306