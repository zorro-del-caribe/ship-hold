import { DBConnectionsPool, WithQueryRunner } from '../interfaces';
import { Builder } from 'ship-hold-querybuilder';
export declare const withQueryRunner: (pool: DBConnectionsPool) => <T extends Builder>(builder: T) => WithQueryRunner & T;
