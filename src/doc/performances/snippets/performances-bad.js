Posts
    .select()
    .include(Users)
    .stream(function* () {
        let first = true;
        try {
            console.log('[');
            while (true) {
                const r = yield;
                if (first) {
                    console.log(JSON.stringify(r));
                } else {
                    console.log(',' + JSON.stringify(r));
                }
                first = false;
            }
        } catch (e) {
            throw e;
        } finally {
            console.log(']');
        }
    });
