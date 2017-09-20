#!/bin/bash

terminate() {
    kill -TERM "$child" 2>/dev/null
}

if [ $DEPLOY ]; then
    node_modules/.bin/forever -a -v -m 20 --minUptime 20000 --spinSleepTime 20000 --no-colors -c "node --harmony" index.js
else
    trap terminate TERM
    IP=`ip address | grep global | sed -r 's/.*inet (.*)\/.*/\1/'`
    node_modules/.bin/nodemon -I -V -- --harmony --inspect=$IP:9229 index.js &
    child=$!
    wait "$child"
fi
