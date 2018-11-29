import { DeleteServiceBuilder, EntityService, InsertServiceBuilder, SelectServiceBuilder, UpdateServiceBuilder } from '../interfaces';
import { Builder } from 'ship-hold-querybuilder';
interface WithServiceBuilderMixin {
    <T extends Builder>(builder: T, table?: string): SelectServiceBuilder | InsertServiceBuilder | UpdateServiceBuilder | DeleteServiceBuilder;
}
/**
 * Create a functional mixin to be applied to a builder to pass metadata related to the service and context the builder was generated with
 * Note: the metadata are part of the "identity" of the builder and therefore are copied when cloning a builder
 * @param {EntityService} service
 * @returns {WithServiceBuilderMixin}
 */
export declare const setAsServiceBuilder: (service: EntityService) => WithServiceBuilderMixin;
export {};
