import { DBConnectionsPool, WithQueryRunner } from '../interfaces';
import { Builder } from 'ship-hold-querybuilder';
export interface WithQueryRunnerMixin {
    <T extends Builder>(builder: T): WithQueryRunner & T;
}
/**
 * Create a functional mixin to be applied to a builder to be able to run the query against an actual database connection
 * Note: the mixin is "stateless" (or at least the connection pool can and should be shared across builders) and therefore can be copied as is when cloning a builder
 * @param {DBConnectionsPool} pool
 * @returns {WithQueryRunnerMixin}
 */
export declare const withQueryRunner: (pool: DBConnectionsPool) => WithQueryRunnerMixin;
