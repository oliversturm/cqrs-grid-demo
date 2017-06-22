#!/bin/bash

# install require node version

### block copied from .profile to initialize nvm
################################################
export NVM_DIR="/home/ubuntu/.nvm"
[ "$BASH_VERSION" ] && npm() { if [ "$*" == "config get prefix" ]; then which node | sed "s/bin\/node//"; else $(which npm) "$@"; fi } # hack: avoid slow npm sanity check in nvm
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
unset npm # end hack
[ "$BASH_VERSION" ] && npm() { if [ "$*" == "config get prefix" ]; then which node | sed "s/bin\/node//"; else $(which npm) "$@"; fi } # hack: avoid slow npm sanity check in nvm
[ -s "/home/ubuntu/.nvm/nvm.sh" ] && . "/home/ubuntu/.nvm/nvm.sh" # This loads nvm
unset npm # end hack
### end copied block
###############################################

nvm install 7.4
nvm alias default 7.4

# install v3.x mongodb
curl -o- https://raw.githubusercontent.com/mongodb/mongo/master/debian/init.d | sudo tee /etc/init.d/mongod > /dev/null
sudo chmod +x /etc/init.d/mongod

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
echo "deb [ arch=amd64 ] http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list
sudo apt-get -qq update
sudo apt-get -q install -y mongodb-org
    
/etc/init.d/mongod start

# patch files
sed -i -e 's/node index.js & fi # port 3000/WEBPROXY_PORT=8081 \0/' Makefile
sed -i -e "s/\/localhost:3000\//\/$C9_HOSTNAME:8081\//" webapp/src/data-access.js

# output follow-up instructions
cat <<EOF
After running this script, please work through these steps:

1. Make sure the output above doesn't show any error messages

2. Click the 'Share' button in the top right corner of the Cloud9 IDE. In
   the 'Links to share' block, check the 'Public' box for the 'Application'
   entry. This is required so the demo front-end application can access
   the web-proxy service without being redirected to an authentication
   page.

From here, you can follow the standard instructions for the demo
to start all the processes:

make modules-install
make run-without-docker

Once the demo runs, access this URL in your browser:
  http://$C9_HOSTNAME
EOF
