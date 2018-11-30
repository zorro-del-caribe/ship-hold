const {iterations, pageSize, breath} = require('../config/bench');
const {Users, Tags, Posts, Comments} = require('./models');
const Sequelize = require('sequelize');
const collectorFactory = require('../collector');

const wait = () => new Promise(resolve => {
    setTimeout(() => resolve(), breath);
});

/*

Pagination on included is not supported

Error: Only HasMany associations support include.separate
at Function._validateIncludedElement (/Volumes/Data/code/ship-hold/node_modules/sequelize/lib/model.js:560:13)
at options.include.options.include.map.include (/Volumes/Data/code/ship-hold/node_modules/sequelize/lib/model.js:395:37)
at Array.map (<anonymous>)
at Function._validateIncludedElements (/Volumes/Data/code/ship-hold/node_modules/sequelize/lib/model.js:390:39)
at Promise.try.then.then (/Volumes/Data/code/ship-hold/node_modules/sequelize/lib/model.js:1570:14)
at tryCatcher (/Volumes/Data/code/ship-hold/node_modules/bluebird/js/release/util.js:16:23)
at Promise._settlePromiseFromHandler (/Volumes/Data/code/ship-hold/node_modules/bluebird/js/release/promise.js:512:31)
at Promise._settlePromise (/Volumes/Data/code/ship-hold/node_modules/bluebird/js/release/promise.js:569:18)
at Promise._settlePromise0 (/Volumes/Data/code/ship-hold/node_modules/bluebird/js/release/promise.js:614:10)
at Promise._settlePromises (/Volumes/Data/code/ship-hold/node_modules/bluebird/js/release/promise.js:693:18)
at Async._drainQueue (/Volumes/Data/code/ship-hold/node_modules/bluebird/js/release/async.js:133:16)
at Async._drainQueues (/Volumes/Data/code/ship-hold/node_modules/bluebird/js/release/async.js:143:10)
at Immediate.Async.drainQueues [as _onImmediate] (/Volumes/Data/code/ship-hold/node_modules/bluebird/js/release/async.js:17:14)
at runCallback (timers.js:694:18)
at tryOnImmediate (timers.js:665:5)
at processImmediate (timers.js:647:5)
*/

(async function () {
    try {
        let iter = 1;
        // const collector = collectorFactory();
        // while (iter <= iterations) {
        const start = Date.now();
        const tag = await Tags
            .findOne({
                include: [{
                    model:Posts,
                    include:[Users],
                    // orderBy:[['published_at','desc']],
                    // limit:5
                }],
                where:{tag:'nisi'}
            });
        console.log(`executed in ${Date.now() - start}ms`);
        console.log(JSON.stringify(tag));

        // collector.collect(Date.now() - start);
        await wait();
        iter++;
        // }
        // collector.print();
    } catch (e) {
        console.log(e);
    } finally {
        process.exit(0);
    }
})();
