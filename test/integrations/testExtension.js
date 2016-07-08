module.exports = function extension (sh) {
  Object.assign(sh.adapters, {
    test(params = {}, assertions, expected) {
      this.stream(params, function * () {
        try {
          while (true) {
            const row = yield;
            assertions.deepEqual(row, expected.shift());
          }
        } catch (e) {
          assertions.fail(e);
        }
        finally {
          sh.stop();
          assertions.end();
        }
      });
    }
  });
  return sh;
};