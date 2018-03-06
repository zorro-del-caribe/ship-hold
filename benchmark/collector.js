module.exports = () => {
	const result = [];
	return {
		collect(r) {result.push(r)},
		mean() {
			return result.reduce((previous, current) => previous + current
				, 0) / result.length;
		},
		worst() {
			return Math.max(...result);
		},
		best() {
			return Math.min(...result)
		},
		median() {
			const sortedResult = result.sort((a, b) => +(a) < +(b) ? -1 : 1);
			const middle = result.length / 2;
			if (result.length % 2 === 0) {
				const prev = sortedResult[middle - 1];
				const next = sortedResult[middle];
				return (prev + next) / 2;
			} else {
				return sortedResult[Math.floor(middle)];
			}
		},
		print(){
			console.log(`mean   : ${this.mean()}ms`);
			console.log(`worst  : ${this.worst()}ms`);
			console.log(`best   : ${this.best()}ms`);
			console.log(`median : ${this.median()}ms`);
		}
	}
};
