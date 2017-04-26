const mongodb = require("mongodb");

const fixObject = require("../message-utils").fixObject;


module.exports = function(o) {
    const db = require("../db")(o);

    this.add('role: event, eventName: entityCreated', (m, r) => {
        //console.log('Event entityCreated received: ', m.event);

	m = fixObject(m);

        const newObject = m.event.payload;
        newObject._id = m.event.aggregate.id;
        
        db(db => db.collection('values').insertOne(newObject, err => {
            if (err) console.error('Error persisting new entity: ', err);
            r();
        }));
    });
};

