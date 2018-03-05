const test = require('zora');
const pointer = require('../../src/lib/json-pointer');

test('pointer get', t => {
	const {get: foo} = pointer('foo');
	t.equal(foo(), undefined);
	t.equal(foo('foo'), undefined);
	t.equal(foo({bar: 'foo'}), undefined);
	t.equal(foo({foo: 'bar'}), 'bar');
	const {get: foobar} = pointer('foo.bar');
	t.equal(foobar(), undefined);
	t.equal(foobar('blah'), undefined);
	t.equal(foobar({foo: 'bar'}), undefined);
	t.equal(foobar({foo: {bar: 'woot'}}), 'woot');
	const {get: foobarblah} = pointer('foo.bar.blah');
	t.equal(foobarblah({foo: {bar: {blah: 'hello'}}}), 'hello');
});

test('pointer set short path', t => {
	const {set: foo} = pointer('foo');
	const target = {};
	foo(target, {otherfoo: 'bar'});
	t.deepEqual(target, {foo: {otherfoo: 'bar'}});
});

test('pointer set long path', t => {
	const {set: foobar} = pointer('foo.bar');
	const target = {};
	foobar(target, {blah: 'woot'});
	t.deepEqual(target, {foo: {bar: {blah: 'woot'}}});
});

test('pointer should blend if there is already a tree', t => {
	const {set: foo} = pointer('foo');
	const target = {foo: {bar: 'woot'}};
	foo(target, {anotherblah: 'wootbis'});
	t.deepEqual(target, {foo: {bar: 'woot', anotherblah: 'wootbis'}});
});

test('pointer on empty path', t => {
	const p = pointer();
	const obj = p.set({id:666,name:'woot'});
	t.deepEqual(obj,{id:666,name:'woot'});
	t.equal(p.get(obj),obj,'should return itself');
});

test('concat arrays when new tree is an array', t=>{
	const p = pointer('foo');
	const obj = p.set({foo:['woot']},['bar','bim']);
	t.deepEqual(obj,{foo:['woot','bar','bim']});
});

// test('pointer should replace array properties', t => {
// 	const p = pointer('foo');
// 	const target = {foo:[1]};
// });

// test('pointer no path', t=>{
// 	const p = pointer();
//
// });
