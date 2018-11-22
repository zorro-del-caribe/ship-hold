import {
    select,
    insert,
    update,
    condition,
    delete as del,
    SelectBuilder,
    UpdateBuilder,
    DeleteBuilder, InsertBuilder
} from 'ship-hold-querybuilder';
import {DBConnectionsPool, ShipHoldBuilders} from '../interfaces';
import {withQueryRunner} from './with-query-runner';

export const buildersFactory = (pool: DBConnectionsPool): ShipHoldBuilders => {

    const runnable = withQueryRunner(pool);

    return {
        select: (...args) => runnable<SelectBuilder>(select(...args)),
        update: (...args) => runnable<UpdateBuilder>(update(...args)),
        delete: (...args) => runnable<DeleteBuilder>(del(...args)),
        insert: (...args) => runnable<InsertBuilder>(insert(...args)),
        if: (...args) => condition().if(...args)
    };
};
