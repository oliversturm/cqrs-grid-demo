#!/bin/bash

terminate() {
	kill -TERM "$child" 2>/dev/null
}

trap terminate TERM

IP=`ip address | grep global | sed -r 's/.*inet (.*)\/.*/\1/'`

echo "IP Address: $IP"

npm run serve

child=$!
wait "$child"
