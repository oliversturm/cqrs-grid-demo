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

GNU make is currently required to use the commands outlined above. The Makefile is simple and you can execute the target commands manually if you don't have GNU make. 

I recommend installing [Cygwin tools](https://cygwin.com/install.html). During the installation, there is an option to add packages, and you can search for "make" at this point and activate it. With Cygwin installed, you can run the item *Cygwin64 Terminal* from the start menu, which gives you access to `make` as well as your sources (note the path format `/cygdrive/<DRIVELETTER>/your/path` -- execute `mount` to see where your drives are).

An alternative to this is probably the Linux support in current Windows 10 releases, I'll add instructions later.

If you want to run the docker-based configuration, you need to install [Docker for Windows](https://docs.docker.com/docker-for-windows/). On current Windows versions, the process is straight-forward. Note that for the `make dcup` configuration, which mounts the local source folders into the containers, you need to activate sharing of your drive in the Docker options dialog (accessible via the system tray icon) -- but if you forget, you will see an error message to this effect.

If you want to `make run-without-docker`, you need a local mongodb, [available here](https://www.mongodb.com/download-center).

