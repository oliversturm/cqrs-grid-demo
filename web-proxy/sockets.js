module.exports = function(seneca, io, liveClients) {
  io.on('connection', socket => {
    //console.log('Client connected');

    socket.emit('hello', undefined, function(data) {
      //console.log('Received client details', data);

      if (data.liveId && liveClients.hasId(data.liveId)) {
        liveClients.registerConnection(data.liveId, socket);
        socket.on('disconnect', function() {
          //console.log('Deregistering id ', data.liveId);

          liveClients.deregister(data.liveId);
          seneca.act({
            role: 'querychanges',
            cmd: 'deregister',
            id: data.liveId
          });
        });
        socket.emit('registered');
        //console.log('Client registered');
      } else socket.disconnect(true);
    });
  });
};
