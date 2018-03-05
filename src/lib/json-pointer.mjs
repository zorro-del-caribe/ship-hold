const recursiveGet = (obj = {}, parts = []) => {
	const p = parts.shift();
	const current = obj[p];
	return (current === undefined || parts.length === 0) ? current : recursiveGet(current, parts);
};

const rootPointer = () => ({
	get: target => target,
	set: (target, newTree) => Object.assign(target, newTree)
});

const jsonPointer = path => ({
	get: target => recursiveGet(target, path.split('.')),
	set: (target, newTree) => {
		let current = target;
		const parts = path.split('.');
		const leaf = parts.pop();
		for (const key of parts) {
			current = current[key] = current[key] === undefined ? {} : current[key];
		}

		current[leaf] = Array.isArray(newTree) ? (current[leaf] || []).concat(newTree) :
			Object.assign(current[leaf] || {}, newTree);

		return target;
	}
});

export default path => path === undefined ? rootPointer() : jsonPointer(path);
