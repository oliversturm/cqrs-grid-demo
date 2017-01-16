FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app
RUN npm install
RUN cd /usr/src/app/static && ../node_modules/.bin/bower --allow-root install

EXPOSE 8080

CMD [ "node", "node_modules/nodemon/bin/nodemon", "index.js" ]

