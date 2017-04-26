const mongodb = require("mongodb");

const fixObject = require("../message-utils").fixObject;


module.exports = function(o) {
    const db = require("../db")(o);

    function createEntity(entity, r) {
        db(db => db.collection('values').insertOne(entity, err => {
            if (err) console.error('Error persisting new entity: ', err);
            r();
        }));
    }
    
    this.add('role: event, eventName: entityCreated', (m, r) => {
        //console.log('Event entityCreated received: ', m.event);

	m = fixObject(m);

        const newObject = m.event.payload;
        newObject._id = m.event.aggregate.id;
        createEntity(newObject, r);
    });

    this.add('role: event, eventName: entityUpdated', (m, r) => {
        //console.log('Event entityUpdated received: ', m.event);
        const seneca = this;
        
	m = fixObject(m);

        db(db => db.collection('values').updateOne(
            { _id: m.event.aggregate.id },
            { $set: m.event.payload }, null, (err, res) => {
                if (err) console.error('Error updating entity: ', err);
                else if (res.modifiedCount == 0) {
                    console.log('Update applied to non-existent entity, creating instead.')
                    const newObject = m.event.payload;
                    newObject._id = m.event.aggregate.id;
                    createEntity(newObject, r);
                }
                else r();
        }));
    });
};

