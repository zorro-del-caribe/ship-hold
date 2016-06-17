const pg = require('pg');
const adapters = require('./adapterExtensions');
const debug = require('debug')('ship-hold');
const util = require('./util');

function diffPointer (row, current = {}) {
  return Object.keys(current)
    .filter(k=>current[k].indexOf(row[k]) === -1);
}

function newRef (aggDirectives, root = '') {
  const output = {};
  for (const d of aggDirectives) {
    const pointerParts = d.pointer.split('.');
    if (root) {
      pointerParts.unshift(root);
    }
    output[pointerParts.join('.')] = [];
    if (d.nested) {
      Object.assign(output, newRef(d.nested, d.association));
    }
  }
  return output;
}

module.exports = function (options = {}) {
  const {service, aggregationDirectives}=options;
  return Object.assign({}, {
    stream: function (params = {}, consumer) {
      if (!aggregationDirectives || aggregationDirectives.length <= 1) {
        // no include: be as fast as possible
        return this._stream(params, consumer);
      } else {
        let lastRow = newRef(aggregationDirectives);
        let valueBuffer;
        let isNew;
        const iterator = consumer();
        iterator.next();
        return this._stream(params, function * () {
          try {
            while (true) {
              const row = yield;
              const df = diffPointer(row, lastRow);
              const normalizedRow = util.normalizeRow(row, aggregationDirectives);
              for (const pointer of df) {
                if (pointer === service.primaryKey) {
                  if (valueBuffer) {
                    iterator.next(valueBuffer)
                  }
                  lastRow = newRef(aggregationDirectives);
                  valueBuffer = normalizedRow;
                  isNew = true;
                } else if (isNew !== true) {
                  const [key,...p] = pointer.split('.').reverse();
                  const jsonPointer = util.jsonPointer(p.reverse().join('.'));
                  const oldVal = jsonPointer.get(valueBuffer);
                  const newVal = jsonPointer.get(normalizedRow);
                  const mergedVal = oldVal ? oldVal.concat(newVal) : newVal;
                  jsonPointer.set(valueBuffer, mergedVal);
                }
                lastRow[pointer].push(row[pointer]);
              }
              isNew = false;
            }
          } catch (e) {
            iterator.throw(e);
          } finally {
            iterator.next(valueBuffer);
            iterator.return();
          }
        });
      }
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
          debug(r);
          iterator.next(service.new(r));
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