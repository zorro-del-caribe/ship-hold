exports.parallels = spec => {
    let tests = [];
    return async t => {
        const originalSubTest = t.test.bind(t);
        const test = (description, spec) => {
            const task = originalSubTest(description, spec);
            tests.push(task);
            return task;
        };
        t.test = test;
        await spec(t);
        return Promise.all(tests);
    };
};
