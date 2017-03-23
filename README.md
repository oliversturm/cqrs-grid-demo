# Running

The standard configuration of the project uses docker and docker-compose to set up containers, each of which runs an individual service. Assuming the docker tools are available, the minimum steps to run the project are these:

* `make modules-install` - goes through all the sub-folders and runs `npm install` and `bower install`

* `make build-docker` - builds all docker images

* `make dcup` - starts all services

At this point, each service container runs its own service, configured with both nodemon and node-inspector. Each container has its project folder mounted live, so changes in the local source code are recognized by the container nodemon and the service is restarted. Each service runs in debug mode and you can connect to node-inspector for the service by navigating to a URL like http://172.18.0.2:57575/debug?port=5858 -- the exact URLs for each service are shown during container startup.

The web application is available at http://localhost:8080

## Running without mounts

`make dcup-nomounts` runs with a different docker-compose config, where the local directories are not mounted into the containers. This means that you don't have to `make modules-install`, because local modules will not be used. However, you *must* `make build-docker` every time source code changes, and restart the containers.

## Running without docker

`make run-without-docker` starts the service processes locally. You *must* have mongodb running locally on its standard port 27017, and there is no built-in way of stopping the processes (`skill node` should do it unless you have other node processes). The configuration does not currently use nodemon or node-inspector.


# Windows

## Using Cygwin and Docker for Windows

GNU make is currently required to use the commands outlined above. The Makefile is simple and you can execute the target commands manually if you don't have GNU make. 

I recommend installing [Cygwin tools](https://cygwin.com/install.html). During the installation, there is an option to add packages, and you can search for "make" at this point and activate it. With Cygwin installed, you can run the item *Cygwin64 Terminal* from the start menu, which gives you access to `make` as well as your sources (note the path format `/cygdrive/<DRIVELETTER>/your/path` -- execute `mount` to see where your drives are).

If you want to run the docker-based configuration, you need to install [Docker for Windows](https://docs.docker.com/docker-for-windows/). On current Windows versions, the process is straight-forward. Note that for the `make dcup` configuration, which mounts the local source folders into the containers, you need to activate sharing of your drive in the docker options dialog (accessible via the system tray icon) -- but if you forget, you will see an error message to this effect.

If you want to `make run-without-docker`, you need a local mongodb, [available here](https://www.mongodb.com/download-center).

## Using the Windows Subsystem for Linux

On Windows 10 you can use the Windows Subsystem for Linux (WSL) to run this project, but so far this doesn't use docker. Here are the steps to follow. I recommend to copy and paste the commands into your console window so you don't risk any typos. If you are not familiar with Unix command line syntax, please be extra careful to copy and paste every character of the commands.

* In the Windows Features dialog, activate the "Windows Subsystem for Linux (Beta)" item and click OK

* Run a bash shell using Windows-R (command `bash`), or from a Command Prompt, or by using the start menu item *Bash on Ubuntu on Windows*. The first time you do this, the necessary files will be downloaded after a confirmation prompt, which can take a minute or two. You also need to set a password for your Linux account.

* [Recommended] Update installed packages by running `sudo apt update` followed by `sudo apt upgrade`

* Install mongodb following [the instructions for Ubuntu trusty](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/) (note that while mongodb is included in Ubuntu by default, that version is very old and doesn't work correctly with this project):

  * Execute `sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6` to install the repository keys
  
  * Execute `echo "deb [ arch=amd64 ] http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.4.list` to add the mongodb repository to the local source list
  
  * Execute `sudo apt update` to update local package lists
  
  * Execute `sudo apt install mongodb-org` to install mongodb. Towards the end you'll see a few messages about upstart, you can disregard these -- WSL doesn't use or support upstart.
  
  * Execute `curl -o- https://raw.githubusercontent.com/mongodb/mongo/master/debian/init.d | sudo tee /etc/init.d/mongodb` to install an init script for this version of mongodb
  
  * Execute `sudo chmod +x /etc/init.d/mongodb` to make the init script executable
  
  * Execute `sudo service start mongodb` to start the mongodb server. Note that the server won't auto-start, so you will have to start it again manually after you restart WSL (i.e. restart your shell).
  
* Install Node.js. I recommend using the nvm node version manager, because it's very convenient to be able to switch between different node versions if you like (`nvm ls-remote` shows a long list of available versions).

  * Execute `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash`
  
  * Close and restart your bash shell (or follow the instructions at the end of the output to avoid the restart)

  * Execute `nvm install v7.4.0` to install node 7.4.0 and make it the default version. Note that 7.3.0 and upwards is a minimum requirement for this project, but you should be fine using newer 7.x versions.

* If you don't want to use nvm, you can install Node.js using `curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -` followed by `sudo apt install nodejs`

* Finally, execute `sudo apt install make` 

* If you have not cloned the repository yet using a Windows version of git and you would like to do this natively in WSL, you need to `sudo apt install git` first.

* If you have cloned the repository using a Windows version of git, you will find it somewhere underneath the path `/mnt/c` (or `/mnt/<yourdrive>`). Note that due to the differences with line endings between Windows and Linux (these are handled automatically by Windows and Linux git clients), there might be issues using a Windows clone in Linux -- I have not tested this.

* Now you can `make modules-install` and then `make run-without-docker` and the project should start up correctly in the Linux subsystem. In case you encounter any problems, take care to check the steps above and make sure you haven't skipped anything.

* In case you feel you have mangled your WSL environment and you'd like to return to the original state, run the command `lxrun /uninstall` from a command prompt (outside of WSL). `lxrun /install` will reinstall the environment afterwards (but this also happens automatically when you run bash again, like before). `lxrun /uninstall` leaves your home directory intact but deletes everything else, and `lxrun /uninstall /full` removes everything including your home directory.

Using the docker engine inside of WSL doesn't appear to be possible at this point. It might be possible to use the Docker for Windows engine combined with the Linux docker client, but there have been issues reported with that combination and I haven't tested the approach yet. [Here is a discussion of various points](http://serverfault.com/questions/767994/can-you-run-docker-natively-on-the-new-windows-10-ubuntu-bash-userspace) in case you're interested.
