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
	builder = typeof builder.noop === 'function' ? builder.noop() : builder.select();

	const [as, relationDef] = Object.entries(relations).find(([name, def]) => def.model === builder.model.name);
	const attributes = normalizeAttributes(builder); // todo pass relation def so we can pass foreignKey by default

	Object.defineProperty(builder, 'relation', {
		value: Object.assign({as, attributes}, relationDef)
	});

	return builder;
});

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