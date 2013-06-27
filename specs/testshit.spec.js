function __foo(){this.a = 'b';}
spec('Testshit tests', function(){
	'use strict';

	var foo,
		scenario = this;

	scenario.
	when('a closure is defined',function(){
	 	foo = new __foo()
		return foo;
	}).
	it('should have access to closure variables',function(){
		expect(foo instanceof __foo, arguments);
	}).
	it('should have scope set in when()', function(){
		expect(foo.a === 'b', arguments);
	});

	scenario.
	when('first test is failing and the second succeeds', function(){}).
	it('should fail and ignore any successors', function(){
		fail(true,arguments);
	}).
	it('should never run this second it()', function(){
		expect(false,arguments);
	});

	scenario.
	when('regex', function(){
		return new RegExp('.')
	}).
	it('should handle instanceof', function () {
		expect(this instanceof RegExp, arguments)
	})


});
