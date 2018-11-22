import { EntityService, InclusionInput, RelationArgument, SelectServiceBuilder } from '../interfaces';
import { Builder } from 'ship-hold-querybuilder';
export declare const normaliseInclude: (aliasToService: Map<string, EntityService>, targetBuilder: SelectServiceBuilder) => (rel: RelationArgument) => InclusionInput;
export declare const setAsServiceBuilder: (service: EntityService) => (builder: Builder, tableName?: string) => any;
