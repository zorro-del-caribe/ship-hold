import { select, insert, update, condition, delete as del } from 'ship-hold-querybuilder';
import { withQueryRunner } from './with-query-runner-builder-mixin';
export const buildersFactory = (pool) => {
    const runnable = withQueryRunner(pool);
    return {
        select: (...args) => runnable(select(...args)),
        update: (...args) => runnable(update(...args)),
        delete: (...args) => runnable(del(...args)),
        insert: (...args) => runnable(insert(...args)),
        if: (...args) => condition().if(...args)
    };
};
