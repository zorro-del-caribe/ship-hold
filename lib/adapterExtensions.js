module.exports = {
  run: function promiseAdapter (params = {}) {
    return new Promise((resolve, reject) => {
      const buffer = [];
      return this.stream(params, function * () {
        try {
          while (true) {
            const row = yield;
            buffer.push(row);
          }
        } catch (e) {
          return reject(e);
        }
        finally {
          resolve(buffer);
        }
      });
    });
  }
};