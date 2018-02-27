const {Readable} = require('stream');

class AggregateStream extends Readable {
	constructor(source, opts) {
		super(Object.assign({}, opts, {objectMode: true}));
		this._source = source;
	}

	_read(size) {

	}

}


module.exports = source => {


};