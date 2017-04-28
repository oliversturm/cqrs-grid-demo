const mongodb = require("mongodb");

const fixObject = require("../message-utils").fixObject;

module.exports = function(o) {
    const db = require("../db")(o);

    // I'm not currently doing anything to make sure that changes
    // are applied in the correct order. Theoretically, events
    // for creation and updating could arrive in any arbitrary order.
    // I hear that an aggregate version or similar might be introduced
    // that would make this easier.

    this.add('role: event, eventName: entityCreated', (m, r) => {
        console.log('Event entityCreated received: ', m.event);
	m = fixObject(m);

        const newObject = m.event.payload;
        newObject._id = m.event.aggregate.id;
        db(db => db.collection('values').insertOne(newObject, err => {
            if (err) console.error('Error persisting new entity: ', err);
            r();
        }));
    });

    this.add('role: event, eventName: entityUpdated', (m, r) => {
        console.log('Event entityUpdated received: ', m.event);
	m = fixObject(m);

        db(db => db.collection('values').updateOne(
            { _id: m.event.aggregate.id },
            { $set: m.event.payload }, null, (err, res) => {
                if (err) console.error('Error updating entity: ', err);
                else if (res.modifiedCount == 0) {
                    console.error('Update applied to non-existent entity, ignoring.');
                }
                r();
        }));
    });
};
