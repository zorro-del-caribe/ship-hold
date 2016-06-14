const pg = require('pg');
const adapters = require('./adapterExtensions');
const debug = require('debug')('ship-hold');
const util = require('./util');


function diff (row, current = {}, directives = []) {
  const diff = [];
  for (const d of directives) {
    const currentPointer = current[d.pointer] || [];
    if (currentPointer.indexOf(row[d.pointer]) === -1) {
      diff.push(d);
    }
  }
  return diff;
}

module.exports = function (options = {}) {
  const {service, aggregationDirectives}=options;
  return Object.assign({}, {

    stream: function (params = {}, consumer) {
      let valueBuffer;
      let lastRow;
      let isNewItem;
      const iterator = consumer();
      iterator.next();
      this._stream(params, function * () {
        try {
          while (true) {
            const row = yield;
            const df = diff(row, lastRow, aggregationDirectives);
            const normalizedRow = util.normalizeRow(row, aggregationDirectives);
            for (const d of df) {
              if (d.relation === 'self') {
                isNewItem = true;
                //flush previous item
                if (valueBuffer) {
                  iterator.next(valueBuffer);
                }
                // reset
                valueBuffer = normalizedRow;
                lastRow = {};
              } else if (d.asCollection && isNewItem !== true) {
                valueBuffer[d.association].push(...normalizedRow[d.association]);
              }
              lastRow[d.pointer] = lastRow[d.pointer] || [];
              lastRow[d.pointer].push(row[d.pointer]);
            }
            isNewItem = false;
          }
        } catch (e) {
          iterator.throw(e);
        } finally {
          iterator.next(valueBuffer);
          iterator.return();
        }
      });
    },

    // this is not a private method. But if you call it you'll get rows as they come from database (with no parsing, aggregation, etc)
    _stream: function (params = {}, consumer) {
      const iterator = consumer();
      iterator.next(); //co routine
      pg.connect(service.connectionString, (err, client, done)=> {
        if (err) {
          done();
          return iterator.throw(err);
        }
        const q = this.build(params); //build must be assigned externally
        debug(q);
        const qargs = [q.text];
        if (q.values.length) {
          qargs.push(q.values);
        }
        const stream = client.query(...qargs);
        stream.on('row', (r)=> {
          iterator.next(r);
        });

        stream.on('end', ()=> {
          done();
          iterator.return();
          debug('DONE');
        });

        stream.on('error', (err)=> {
          done();
          iterator.throw(err);
        });
      });
    }
  }, adapters);
};