#!/bin/bash

terminate() {
    sleep 20
    kill -TERM "$child" 2>/dev/null
}

if [ $DEPLOY ]; then
    node --harmony index.js
else
    trap terminate TERM

    IP=`ip address | grep global | sed -r 's/.*inet (.*)\/.*/\1/'`
    
    echo "IP Address: $IP"
    
    node-inspector --no-preload --web-host=$IP --web-port=57575 &
    
    sleep 1
    
    node_modules/.bin/nodemon -I -V -- --harmony --debug index.js &
    child=$!
    wait "$child"
fi
