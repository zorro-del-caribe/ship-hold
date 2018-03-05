const select = builder => {
	const {relation} = builder;
	const {attributes, as: currentAs} = relation;
	const selectFields = attributes.map(attr => {
		const value = [currentAs, attr].join('.');
		const asLabel = `"${value}"`;
		return {value, as: asLabel};
	});

	if (builder[Symbol.iterator]) {
		for (const b of builder) {
			selectFields.push(...select(b).map(({value}) => ({
				value: `"${currentAs}"."${value}"`,
				as: `"${[currentAs].concat(value.split('.')).join('.')}"`
			})));
		}
	}
	return selectFields;
};

const getReverseAssociation = (sourceModel, targetModel) => {
	const {definition} = targetModel;
	return Object.entries(definition.relations).find(([name, def]) => def.model === sourceModel.name);
};

const manyToMany = (sourceModel, targetBuilder, {model}) => builder => {
	const {relation, model: targetModel} = targetBuilder;
	const {as, through, referenceKey} = relation;
	const pivotModel = model(through);
	const {definition: {table: targetTable, primaryKey: targetPrimaryKey}} = targetModel;
	const {definition: {table: pivotTable}} = pivotModel;
	const {definition: {table: sourceTable, primaryKey: sourcePrimaryKey}} = sourceModel;
	const sourceKeyOnPivot = referenceKey;
	const [{referenceKey: targetKeyOnPivot}] = getReverseAssociation(sourceModel, targetBuilder.model).reverse();

	const pivotSelect = [sourceKeyOnPivot, targetKeyOnPivot].map(key => ({
		value: [pivotTable, key].join('.'),
		as: `"${through}.${key}"`
	}));

	const allSelect = pivotSelect.concat(targetTable + '.*');
	const pivotLeftOperand = [pivotTable, targetKeyOnPivot].join('.');
	const pivotRightOperand = `"${targetTable}"."${targetPrimaryKey}"`;

	let pivotBuilder = pivotModel.select(...allSelect);

	pivotBuilder = pivotBuilder
		.join({value: targetBuilder, as: targetTable})
		.on(pivotLeftOperand, pivotRightOperand)
		.noop();

	const leftOperand = [sourceTable, sourcePrimaryKey].join('.');
	const rightOperand = `"${as}"."${through}.${sourceKeyOnPivot}"`;

	return builder
		.leftJoin({value: pivotBuilder, as})
		.on(leftOperand, rightOperand)
		.noop();
};

const oneToMany = (sourceModel, targetBuilder) => builder => {
	const {relation} = targetBuilder;
	const {definition: sourceDef} = sourceModel;
	const [def] = getReverseAssociation(sourceModel, targetBuilder.model).reverse();
	const {as} = relation;

	const leftOperand = [sourceDef.table, sourceDef.primaryKey].join('.');
	const rightOperand = `"${as}"."${def.foreignKey}"`;

	return builder
		.leftJoin({value: targetBuilder, as})
		.on(leftOperand, rightOperand)
		.noop();
};

const manyToOne = (sourceModel, targetBuilder) => builder => {
	const {relation} = targetBuilder;
	const {as, foreignKey} = relation;
	const leftOperand = [sourceModel.definition.table, foreignKey].join('.');
	const rightOperand = `"${as}"."${targetBuilder.model.primaryKey}"`;
	return builder.leftJoin({value: targetBuilder, as})
		.on(leftOperand, rightOperand)
		.noop();
};

const oneToOne = (sourceModel, targetBuilder) => builder => {
	const {relation: {as}} = targetBuilder;
	const [{foreignKey}] = getReverseAssociation(sourceModel, targetBuilder.model).reverse();
	const leftOperand = [sourceModel.definition.table, sourceModel.primaryKey].join('.');
	const rightOperand = `"${as}"."${foreignKey}"`;
	return builder
		.leftJoin({value: targetBuilder, as})
		.on(leftOperand, rightOperand)
		.noop();
};

const joinActions = {
	hasMany: oneToMany,
	belongsTo: manyToOne,
	hasOne: oneToOne,
	belongsToMany: manyToMany,
	self: b => b
};

export default (sourceModel, targetBuilder, sh) => {
	const {relation: relDef} = targetBuilder;
	const joinFunc = joinActions[relDef.relation];

	if (joinFunc === undefined) {
		throw new Error(`unknown relation between ${sourceModel.name} and ${targetBuilder.model.name}`);
	}

	return {
		selectFields: select(targetBuilder),
		join: joinFunc(sourceModel, targetBuilder, sh)
	};
};
