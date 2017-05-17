const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;

const fixObject = require('../message-utils').fixObject;

module.exports = function(o) {
  const db = require('../db')(o);

  this.add('role:entitiesCommand, domain:values, cmd:create', (m, r) => {
    const seneca = this;

    m = fixObject(m);

    seneca.act(
      {
        role: 'validation',
        domain: 'values',
        cmd: 'validateOne',
        instance: m.instance
      },
      (err, res) => {
        if (err) r(err);
        if (res.valid) {
          db(db =>
            db.collection('values').insertOne(m.instance, (err, res) => {
              if (err) r(null, { err: err });
              else r(null, { id: res.insertedId.toHexString() });
            })
          );
        } else {
          r(null, { err$: 'invalid' });
        }
      }
    );
  });

  this.add('role:entitiesCommand, domain:values, cmd:update', (m, r) => {
    const seneca = this;

    m = fixObject(m);

    seneca.act(
      {
        role: 'validation',
        domain: 'values',
        cmd: 'validateOne',
        instance: m.instance,
        allowIncomplete: true
      },
      (err, res) => {
        if (err) r(err);
        else if (res.valid) {
          db(db =>
            db
              .collection('values')
              .updateOne(
                { _id: new ObjectID(m.id) },
                { $set: m.instance },
                null,
                (err, res) => {
                  if (err) r(null, { err: err });
                  else if (res.modifiedCount == 0) {
                    r(null, { err: 'unknownid' });
                  } else r();
                }
              )
          );
        } else r(null, { err$: 'invalid' });
      }
    );
  });
};
