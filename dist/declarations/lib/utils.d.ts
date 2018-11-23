import { EntityService, InclusionInput, RelationArgument, SelectServiceBuilder } from '../interfaces';
export declare const normaliseInclude: (aliasToService: Map<string, EntityService>, targetBuilder: SelectServiceBuilder) => (rel: RelationArgument) => InclusionInput;
