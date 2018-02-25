const relationDefinitions = require('./relationDefinitions');
const modelFactory = require('./model');

// Create a map of model services
module.exports = (builders) => {
	const registry = Object.create(null);
	return {
		[Symbol.iterator]() {
			return Object.entries(registry)[Symbol.iterator]();
		},
		model(name, defFunc) {
			if (defFunc) {
				const definition = defFunc(relationDefinitions);
				const columnsDefinition = definition.columns;
				for (const column of Object.keys(columnsDefinition)) {
					const def = columnsDefinition[column];
					if (typeof def === 'string') {
						columnsDefinition[column] = {type: def};
					}
				}
				registry[name] = modelFactory({definition, builders, name});
			}
			if (registry[name] === undefined) {
				throw new Error('could not find the model ' + name);
			}
			return registry[name];
		}
	};
};
