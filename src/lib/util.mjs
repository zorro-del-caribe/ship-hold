import {nodes} from 'ship-hold-querybuilder';

const contextify = context => attr => context === undefined ? attr : context + `.${attr}`;
const jsonPointer = require('./json-pointer');

// TODO could be inlined code (for perf to check)
export const createParser = (builder, context) => {
	const {relation} = builder;
	const {key, asCollection, attributes} = relation;
	const expandedAttributes = attributes.map(attr => attr === '*' ? Object.keys(builder.model.definition.columns) : attr)
		.reduce((acc, curr) => acc.concat(curr), []);
	const attribute = contextify(context);
	const pointer = jsonPointer(context);
	const subParsers = [];
	if (builder[Symbol.iterator]) {
		for (const b of builder) {
			const {relation} = b;
			const {as} = relation;
			const newContext = context === undefined ? as : context + `.${as}`;
			subParsers.push(Object.assign(createParser(b, newContext), {as}));
		}
	}

	const parse = row => {
		if (row[attribute(key)] === null) {
			return asCollection === true ? [] : null;
		}
		const item = {};
		for (const attr of expandedAttributes) {
			item[attr] = row[attribute(attr)];
		}
		for (const {as, parse} of subParsers) {
			item[as] = parse(row);
		}
		return asCollection === true ? [item] : item;
	};

	const keyProp = attribute(key);
	return {
		* [Symbol.iterator]() {
			yield this;
			for (const sp of subParsers) {
				yield * sp;
			}
		},
		parse,
		merge: (src, target = {}) => pointer.set(target, parse(src)),
		key: row => row === null ? null : row[keyProp]
	};
};


export const normalizeAttributes = builder => [...builder.node('select')]
	.filter(n => n.as === undefined || (n.as.split('.').length === 1))
	.map(({as, value}) => as ? as : value.split('.').pop());

export const normalizeInclude = ({relations}, {model}, ...includes) => includes.map(inc => {
	// Include can be string (as relation name),a builder, a model service.
	let builder;
	const isString = typeof inc === 'string';

	// If a string
	builder = isString ? model(relations[inc].model) : inc;

	// A builder vs a service model (and revoke on going proxies)
	builder = 'noop' in builder ? builder.noop() : builder.select();

	const [as, relationDef] = Object.entries(relations).find(([name, def]) => def.model === builder.model.name);
	const relation = Object.assign({
		key: builder.model.primaryKey,
		as,
		attributes: normalizeAttributes(builder)
			.map(n => n === '*' ? Object.keys(builder.model.definition.columns) : n)
			.reduce((acc, curr) => acc.concat(curr), [])
	}, relationDef);

	// We can't wildcard for nested include otherwise will bump into ambiguity
	if (builder[Symbol.iterator] === undefined) {
		builder.node('select', nodes.compositeNode({separator: ', '}).add('*'));
	}

	Object.defineProperty(builder, 'relation', {
		value: relation
	});

	return builder;
});
