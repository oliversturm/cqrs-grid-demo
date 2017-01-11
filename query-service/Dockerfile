FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install

EXPOSE 3001

CMD [ "node", "node_modules/nodemon/bin/nodemon", "index.js" ]

