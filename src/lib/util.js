const {nodes} = require('ship-hold-querybuilder');
exports.jsonPointer = require('smart-table-json-pointer');


const normalizeAttributes = (builder) => {
	const selectAttributes = [...builder.node('select')]
		.map(n => n.value)
		.map(n => n === '*' ? Object.keys(builder.model.definition.columns) : n)
		.reduce((acc, curr) => acc.concat(curr), []);

	return [...new Set(selectAttributes).values()];

	//todo nested include

	/*
	const selectNodesValues = [...builder.selectNodes].map(n => n.value);
	const normalizedSelectNodes = selectNodesValues[0] === '*' ? sh.model(builder.name).columns : selectNodesValues;
	const normalizedAttributes = [];
	if (builder.associations) {
		// if nested include
		const selfAsso = builder.associations.find(a => a.relation === 'self');
		const selfModel = sh.model(selfAsso.model);
		for (const sv of normalizedSelectNodes) {
			const [base, ...rest] = sv.split('.');
			if (base === selfModel.table) {
				if (rest[0] === '*') {
					normalizedAttributes.push(...selfModel.columns);
				} else {
					normalizedAttributes.push(rest.join('.'));
				}
			} else {
				normalizedAttributes.push(sv);
			}
		}
	} else {
		normalizedAttributes.push(...normalizedSelectNodes);
	}

	return normalizedAttributes;
	*/
};


exports.normalizeInclude = ({relations}, {model}, ...includes) => includes.map(inc => {
	// Include can be string (as relation name),a builder, a model service.
	let builder;
	const isString = typeof inc === 'string';

	// If a string
	builder = isString ? model(relations[inc].model) : inc;

	// A builder vs a service model (and revoke on going proxies)
	builder = 'noop' in builder ? builder.noop() : builder.select();

	const [as, relationDef] = Object.entries(relations).find(([name, def]) => def.model === builder.model.name);
	const attributes = normalizeAttributes(builder); // todo pass relation def so we can pass foreignKey by default

	builder.node('select', nodes.compositeNode({separator: ', '}).add('*'));

	Object.defineProperty(builder, 'relation', {
		value: Object.assign({as, attributes, pointer: builder.model.primaryKey}, relationDef)
	});

	return builder;
});


const aggregateAsItem = rel => firstRow => {
	const {as, pointer} = rel;
	const filtered = firstRow
		.filter(([key, val]) => key.length > 0 && key[0] === as)
		.map(([[as, prop], value]) => [prop, value]);
	const obj = {};
	for (const [key, value] of filtered) {
		obj[key] = value;
	}
	return obj[pointer] === null ? null : obj;
};

const aggregateAsCollection = rel => (first, ...rest) => {
	const {pointer} = rel;
	const aggrFunc = aggregateAsItem(rel);
	const firstResult = aggrFunc(first);

	if (firstResult === null) {
		return [];
	}

	const map = new Map([[firstResult[pointer], firstResult]]);

	for (const r of rest) {
		const item = aggrFunc(r);
		map.set(item[pointer], item);
	}

	return [...map.values()];
};

exports.aggregate = rels => rows => {

	const entries = rows.map(r => Object.entries(r)
		.map(([key, value]) => [key.split('.'), value])
	);

	const obj = {};
	for (const [[key], value] of entries[0].filter(([key]) => key.length === 1)) {
		obj[key] = value;
	}

	for (const {relation} of rels) {
		const {asCollection, as} = relation;
		const aggregateFunc = asCollection === true ? aggregateAsCollection(relation) : aggregateAsItem(relation);
		obj[as] = aggregateFunc(...entries);
	}

	return obj;
};


// exports.normalizeRow = function normalizeRow(row, aggDirectives = []) {
// 	const output = {};
// 	const rowKeys = Object.keys(row);
// 	const selfProps = rowKeys.filter(key => key.split('.').length === 1);
//
// 	for (const prop of selfProps) {
// 		output[prop] = row[prop];
// 	}
//
// 	for (const ad of aggDirectives.filter(ad => ad.relation !== 'self')) {
// 		if (!row[ad.pointer]) {
// 			output[ad.as] = ad.asCollection ? [] : null;
// 		} else if (ad.nested && ad.nested.length) {
// 			const subR = subRow(row, ad);
// 			const nestedNormalized = normalizeRow(subR, ad.nested);
// 			output[ad.as] = ad.asCollection ? [nestedNormalized] : nestedNormalized;
// 		} else {
// 			const props = ad.attributes.map(f => {
// 				return {pointer: [ad.as, f].join('.'), attr: f}
// 			});
// 			const item = {};
// 			for (const {attr, pointer} of props) {
// 				item[attr] = row[pointer];
// 			}
// 			output[ad.as] = ad.asCollection ? [item] : item;
// 		}
// 	}
// 	return output;
// };
//
// function subRow(row, assoDef) {
// 	return Object.keys(row)
// 		.filter(k => k.split('.')[0] === assoDef.as)
// 		.map(k => {
// 			[main, ...subs] = k.split('.');
// 			return subs.join('.');
// 		})
// 		.reduce((previous, current) => {
// 			previous[current] = row[[assoDef.as, current].join('.')];
// 			return previous;
// 		}, {});
// }