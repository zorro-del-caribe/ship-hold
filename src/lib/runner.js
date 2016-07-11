const adapters = require('./adapterExtensions');
const debug = require('debug')('ship-hold');
const util = require('./util');

module.exports = function runnerFactory () {
  return {
    runner: function (options = {}) {
      const shiphold = options.shiphold || this;
      const builder = options.builder || this;
      const {service} = options;
      const {associations:aggregationDirectives} = builder;
      return Object.assign({
        // this is not a private method. But if you call it you'll get rows as they come from database (with no parsing, aggregation, etc)
        _stream: function (params = {}, consumer) {
          const iterator = consumer();
          iterator.next();

          shiphold.getConnection()
            .then(connection => {
              const {client, done}=connection;
              const q = builder.build(params);
              debug(q);
              const qargs = [q.text];
              if (q.values.length) {
                qargs.push(q.values);
              }
              const stream = client.query(...qargs);
              stream.on('row', (r)=> {
                // debug(r);
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
            })
            .catch(e=>iterator.throw(e));
        },

        stream: function (params = {}, consumer) {
          const hasNoInclude = !aggregationDirectives || aggregationDirectives.length <= 1;
          if (hasNoInclude) {
            // stream as fast as possible
            return this._stream(params, consumer);
          } else {
            let lastRow = createEmptyRefPointerList(aggregationDirectives);
            let valueBuffer;
            let isNewInstance;
            const iterator = consumer();
            iterator.next();
            
            return this._stream(params, function * () {
              try {
                while (true) {
                  const row = yield;
                  const df = getDiffPointers(row, lastRow);
                  const normalizedRow = util.normalizeRow(row, aggregationDirectives);
                  for (const pointer of df) {
                    if (pointer === service.primaryKey) {
                      if (valueBuffer) {
                        iterator.next(valueBuffer)
                      }
                      lastRow = createEmptyRefPointerList(aggregationDirectives);
                      valueBuffer = normalizedRow;
                      isNewInstance = true;
                      for (const p of Object.keys(lastRow)) {
                        lastRow[p].push(row[p]);
                      }
                    } else if (isNewInstance !== true) {
                      const [key,...p] = pointer.split('.').reverse();
                      const path = p.reverse().join('.');
                      const jsonPointer = util.jsonPointer(path);
                      const oldVal = jsonPointer.get(valueBuffer);
                      const newVal = jsonPointer.get(normalizedRow);
                      const mergedVal = oldVal ? oldVal.concat(newVal) : newVal;
                      jsonPointer.set(valueBuffer, mergedVal);
                      lastRow[pointer].push(row[pointer]);
                    }
                  }
                  isNewInstance = false;
                }
              } catch (e) {
                return iterator.throw(e);
              } finally {
                if (valueBuffer) {
                  iterator.next(valueBuffer);
                }
                iterator.return();
              }
            });
          }
        }
      }, adapters);
    }
  };
};

function getDiffPointers (row, current = {}) {
  return Object.keys(current)
    .filter(k=>current[k].indexOf(row[k]) === -1);
}

function createEmptyRefPointerList (aggDirectives, root = '') {
  const output = {};
  for (const d of aggDirectives) {
    const pointerParts = d.pointer.split('.');
    if (root) {
      pointerParts.unshift(root);
    }
    output[pointerParts.join('.')] = [];
    if (d.nested) {
      Object.assign(output, createEmptyRefPointerList(d.nested, d.as));
    }
  }
  return output;
}