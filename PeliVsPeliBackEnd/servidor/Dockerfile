# dsadjlfas
FROM ubuntu:trusty

MAINTAINER Pablo Schonwiesner

RUN apt-get update && \
	apt-get -y install curl && \
	curl -sL https://deb.nodesource.com/setup_6.x | sudo bash - && \
	apt-get -y install python build-essential nodejs

ADD package.json /src/package.json

WORKDIR /src

EXPOSE 8080