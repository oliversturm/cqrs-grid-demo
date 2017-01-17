FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install

EXPOSE 3002

CMD ip address | grep global && node node_modules/nodemon/bin/nodemon index.js

