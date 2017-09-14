#!/bin/bash

# a bit static for the instance... hm.
IP=$(aws ec2 describe-instances --instance-ids i-0028e6a53e9c08cc7 --query 'Reservations[*].Instances[*].PublicIpAddress' --output text)
REPLACE_URL="s/\/localhost:3000\(.*\)$/\/$IP:3000\1/"
sed -i -e $REPLACE_URL webapp/static/*Grid.js webapp/static/*Grid.html webapp/static/index.js