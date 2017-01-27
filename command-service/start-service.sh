#!/bin/bash

IP=`ip address | grep global | sed -r 's/.*inet (.*)\/.*/\1/'`

echo "IP Address: $IP"

node-inspector --no-preload --web-host=$IP --web-port=57575 &

sleep 1

node_modules/.bin/nodemon -- --harmony --debug index.js
