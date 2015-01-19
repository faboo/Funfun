/**
 * Funfun is a work in progress and far from complete. I'll be adding more
 * operations and utility functions as I use it, but pull requests are welcome!
 */

(function(eval){
	//
	// internal utils

	function withParameters(arity, body){
		var params = []
		var func = '(function ('

		for(var param = 0; param < arity; param += 1)
			params.push('param'+param)

		func += params.join(', ') + '){\n' + body + '\n})'

		return func
	}

	function getMemo(func, memo){
		if(!func._fn_memo)
			Object.defineProperty(func, '_fn_memo', {value: { }})

		return func._fn_memo[memo]
	}

	function setMemo(func, memo, value){
		if(!func._fn_memo)
			Object.defineProperty(func, '_fn_memo', {value: { }})

		return func._fn_memo[memo] = value
	}

	//
	// section: Functions

	/**
	 * Curries the provided function. The resultant function can be called on
	 * any number of number of arguments, either calling the original function
	 * if enough arguments have been provided, or returning a new curried
	 * function that accepts the rest of the arguments.
	 *
	 * Example:
	 *
	 * 	function add(a, b, c, d){
	 * 		return a + b + c + d
	 * 	}
	 *
	 * 	addOne = fn.curry(add)(3)
	 *	// -> function(b, c, d) { .... }
	 *	addSome = add(7, 5)
	 *	// -> function(d) { ... }
	 *	addSome(2)
	 *	// -> 17
	 *
	 * The property `curry` is available on Functions which returns a curried
	 * version of the function. This new function is cached so subsequent uses
	 * of the property always return the same function.
	 *
	 * Example:
	 *
	 * 	function add(a, b)
	 *
	 * 	curriedAdd = add.curry
	 * 	plusOne = curriedAdd(1)
	 */
	function curry(
		// The function to curry.
		func,
		// An optional value to use as `this` when calling the function.
		useThis){
		if(arguments.length < 2)
			useThis = this

		function curried(args){
			var result = eval(withParameters(
				func.length - args.length,
				 'var newArgs = args.concat(toArray(arguments))\n'
				+'if(newArgs.length >= func.length)\n'
					+'return func.apply(useThis, newArgs)\n'
				+'else\n'
					+'return curried(newArgs)'))

			return setMemo(result, 'curry', result)
		}

		// The fully curried version of `func`.
		return curried([])
	}

	/**
	 * Compose one or more functions. Returns a new function that is the
	 * composition of the passed functions. The resultant function is itself
	 * curried.
	 *
	 * Example:
	 *
	 * 	function plusOne(num){
	 * 		return 1 + num
	 * 	}
	 *
	 * 	function timesTen(num){
	 * 		return 10 * num
	 * 	}
	 *
	 * 	fn.compose(plusOne, timesTime)(2)
	 *	// -> 21
	 *
	 * The fn object is actually an alias for fn.compose.
	 *
	 * Example:
	 *
	 * 	function plusOne(num){
	 * 		return 1 + num
	 * 	}
	 *
	 * 	function timesTen(num){
	 * 		return 10 * num
	 * 	}
	 *
	 * 	fn(plusOne, timesTime)(2)
	 *	// -> 21
	 * 	
	 */
	function compose(){
		var functions = toArray(arguments)
		var top = functions.pop()
		var composed =
			eval(withParameters(
			top.length,
			 'var result = top.apply(this, arguments)\n'
			+'return functions.reduceRight('
				+'function(result, func){'
					+'return func(result)'
				+'},'
				+'result)'))

		// A function that is the composition of the provided functions.
		return composed.curry
	}

	/**
	 * Provide transformations for the arguments of a function. transform()
	 * takes a function and additional functions to act as transformers for that
	 * functions respective parameters.
	 *
	 * Example:
	 *
	 * 	function add(a, b){
	 * 		return a + b
	 * 	}
	 *
	 * 	addStrings = fn.trans(add, parseInt, parseInt)
	 *	// -> function (a, b) { ... }
	 *	addStrings('1', '2')
	 *	// -> 3
	 *
	 * The property `trans` is available on Functions that is an alias to
	 * fn.trans.
	 *
	 * Example:
	 *
	 * 	function add(a, b){
	 * 		return a + b
	 * 	}
	 *
	 * 	addStrings = add.trans(parseInt, parseInt)
	 *	// -> function (a, b) { ... }
	 */
	function transform(
		// The function whose arguments are to be transformed.
		func){
		var transformations = toArray(arguments).tail()

		// A new function that transforms its arguments before calling `func`
		// on them.
		return function(){
			var args = []

			for(var index = 0; index < arguments.length; index += 1)
				args[index] = transformations[index] !== undefined
					? transformations[index](arguments[index])
					: arguments[index]

			return func.apply(this, args)
		}
	}

	/**
	 * Reverses the order of parameters to a function.
	 *
	 * Example:
	 *
	 * 	function subtract(a, b, c){
	 * 		return a - b - c
	 * 	}
	 *
	 * 	subtract(5, 2, 1)
	 *	// -> 2
	 * 	fn.flip(subtract)(5, 2, 1)
	 *	// -> -6
	 *	fn.flip(subtract)(5, 2, 1, 10)
	 *	// -> -6
	 *
	 * The property `flip` is available on Functions that returns a flipped
	 * version of the function. This new function is cached so subsequent uses
	 * of the property always return the same function.
	 *
	 * Example:
	 *
	 *
	 * 	function subtract(a, b, c){
	 * 		return a - b - c
	 * 	}
	 *
	 * 	subtract(5, 2, 1)
	 *	// -> 2
	 *	subtract.flip(5, 2, 1)
	 *	// -> -6
	 */
	function flip(
		// The function to flip.
		func,
		// A this parameter to use when calling `func`. Optional.
		useThis){
		if(arguments.length < 2)
			useThis = this

		var result = curry(eval(withParameters(
			func.length,
			'return func.apply(useThis, reverse(take('+func.length+', toArray(arguments))))')))

		setMemo(func, 'flip', result)
		setMemo(func, 'curry', result)

		// A new function that, when called, calls the original function with
		// its arguments in reverse order. When called with more arguments than
		// the original function expects, the extra arguments are ignored.
		return result
	}

	/**
	 * Create a function that will create a new object based on a constructor
	 * function, similar to the 'new' keyword.
	 *
	 * Example:
	 *
	 * 	function Foo(name){
	 * 		this.name = name
	 * 	}
	 *
	 * 	var newFoo = fn.new(Foo)
	 *
	 * 	var foo = newFoo('Harry')
	 * 	foo.name
	 *	// -> 'Harry'
	 *	foo instanceof Foo
	 *	// -> true
	 */
	function asNew(
		// The constructor to use when creating an object.
		func){
		var constructor = eval(withParameters(
			func.length,
			 'var object = Object.create(func.prototype)\n'
			+'func.apply(object, arguments)\n'
			+'return object'))

		// Returns a function that, when called, creates a new object based on
		// `func`'s prototype, and calls `func` with `this` as the new object,
		// passing through any arguments.
		return constructor.curry
	}

	Object.defineProperties(
		Function.prototype,
		{ curry:
			{ get:
				function(){
					var curried = getMemo(this, 'curry')

					if(!curried)
						if(this.length < 1)
							curried = this
						else
							curried = setMemo(this, 'curry', curry(this))

					return curried
				}
			}
		, trans: { value: transform }
		, flip:
			{ get:
				function(){
					var flipped = getMemo(this, 'flip')

					if(!flipped)
						if(this.length < 2)
							flipped = this.curry
						else
							flipped = setMemo(this, 'flip', flip(this))

					return flipped
				}
			}
		})

	//
	// section: Arrays

	/**
	 * Group together the elements of an array.
	 *
	 * Example:
	 *
	 * 	function oddEven(num){
	 * 		return num % 2? 'even' : 'odd'
	 * 	}
	 * 	var array = [1, 2, 3, 4, 5]
	 *
	 * 	fn.group(oddEven, array)
	 *	// -> { 'even': [2, 4], 'odd': [1, 3, 5] }
	 *
	 * The property `group` is provided on Arrays and is an alias to fn.group.
	 *
	 * Example:
	 *
	 * 	function oddEven(num){
	 * 		return num % 2? 'even' : 'odd'
	 * 	}
	 *
	 * 	[1, 2, 3, 4, 5].group(oddEven, array)
	 *	// -> { 'even': [2, 4], 'odd': [1, 3, 5] }
	 */
	function group(
		// Function to determine the key to group by.
		func,
		// The array to act upon.
		array){
		if(!Array.isArray(array ))
			array = this

		// Returns a new object containing the elements of the array, grouped
		// together using the provided function to determine the key.
		return array.reduce(
			function(groups, value){
				var as = func(value)

				if(!(as in groups))
					groups[as] = []

				groups[as].push(value)

				return groups
			},
			{ })
	}

	/**
	 * Add a value to the begining of array non-destructively.
	 *
	 * Example:
	 *
	 *	fn.cons(1, [2, 3, 4, 5])
	 *	// -> [1, 2, 3, 4, 5]
	 *
	 * The property `cons` is provided on Arrays and is an alias to fn.cons.
	 *
	 * Example:
	 *
	 *	[2, 3, 4, 5].cons(1)
	 *	// -> [1, 2, 3, 4, 5]
	 */
	function cons(
		// The value to prepend.
		value,
		// The array to act upon.
		array){
		if(!Array.isArray(array ))
			array = this

		// A new array whose elements are the provided value, followed by the
		// elements of the provided array.
		return [value].concat(array)
	}

	/**
	 * Returns a new array with the values of a particular property of each of
	 * the elements in an array.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.pluck('a', [{a: 1}, {a: 2}])
	 *	// -> [1, 2]
	 *
	 * The property `pluck` is provided on Arrays and is an alias to fn.pluck.
	 *
	 * Example:
	 *
	 * 	[{a: 1}, {a: 2}].pluck('a')
	 *	// -> [1, 2]
	 */
	function pluck(
		// The name of the property to isolate.
		key,
		// The array to act upon.
		array){
		if(!Array.isArray(array ))
			array = this

		var plucked = []

		for(var index in array)
			plucked.push(array[index][key])

		// An array of the 'plucked' properties.
		return plucked
	}

	/**
	 * Reverse the elements of an array. This is similar to
	 * Array.prototype.reverse, but non-destructive.
	 *
	 * Example:
	 *
	 * 	fn.reverse([1, 2, 3,])
	 *	// -> [3, 2, 1]
	 *
	 * **NOTE**: This does *not* replace the built-in, reverse-in-place
	 * `Array.prototype.reverse`!
	 */
	function reverse(
		// The array to reverse.
		array){
		var reversed = []

		for(var index = array.length - 1; index >= 0; index -= 1)
			reversed.push(array[index])

		// Returns a new array with the elements of the original but in the
		// opposite order.
		return reversed
	}

	/**
	 * Returns the first value in the array.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.head([1, 2, 3])
	 *	// -> 1
	 *
	 * The property `head` is provided on Arrays and is an alias to fn.head.
	 *
	 * Example:
	 *
	 * 	[1, 2, 3].head()
	 *	// -> [1]
	 */
	function head(
		// The array to pull from.
		array){
		if(!Array.isArray(array ))
			array = this

		// The first element of `array`.
		return array[0]
	}

	/**
	 * Returns a new array containing the elements of the specified array except
	 * the first.
	 *
	 * Example:
	 *
	 * 	fn.tail([1, 2, 3])
	 *	// -> [2, 3]
	 *
	 * The property `tail` is provided on Arrays and is an alias to fn.tail.
	 *
	 * Example:
	 *
	 * 	[1, 2, 3].tail()
	 *	// -> [2, 3]
	 */
	function tail(
		// The array pull from.
		array){
		if(!Array.isArray(array ))
			array = this

		// The last element of `array`.
		return array.slice(1)
	}

	/**
	 * Returns a new array containing the elements of the specified array except
	 * the last (i.e. the opposite of fn.tail).
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.init([1, 2, 3])
	 *	// -> [1, 2]
	 *
	 * The property 'init' is provided on Arrays and is an alias to fn.init.
	 *
	 * Example:
	 *
	 * 	[1, 2, 3].init()
	 *	// -> [1, 2]
	 */
	function init(
		// The array to retrieve elements from.
		array){
		if(!Array.isArray(array ))
			array = this

		// The elements of `array`, except the last one.
		return array.slice(0, array.length - 2)
	}

	/**
	 * Returns the last value in the array.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.last([1, 2, 3])
	 *	// -> 3
	 *
	 * The property 'last' is provided on Arrays and is an alias to fn.last.
	 *
	 * Example:
	 *
	 * 	[1, 2, 3].last()
	 *	// -> [3]
	 */
	function last(
		// The array to pull from.
		array){
		if(!Array.isArray(array ))
			array = this

		// The final element in `array`.
		return array[array.length - 1]
	}

	/**
	 * Get the first several elements of an array.
	 *
	 * Example:
	 * 	
	 * 	fn.take(2, [1, 2, 3, 4])
	 *	// -> [1, 2]
	 *
	 * The property 'take' is provided on Arrays and is an alias to fn.take.
	 *
	 * Example:
	 *
	 * 	[1, 2, 3, 4].take(2)
	 *	// -> [1, 2]
	 */
	function take(
		// Number of elements to take.
		amount,
		// The array to pull from.
		array){
		if(!Array.isArray(array ))
			array = this

		// A new array containing the first `amount` elements of the
		// specified array.
		return array.slice(0, Math.min(amount, array.length - 1))
	}

	/**
	 * Get only the unique elements of an array. Uniqueness is determined by a
	 * strict (===) equality comparison.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.uniq([1, 2, 2, 4])
	 *	// -> [1, 2, 4]
	 *
	 * The property 'uniq' is provided on Arrays and is an alias to fn.uniq.
	 *
	 * Example:
	 *
	 * 	[1, 2, 2, 4].uniq()
	 *	// -> [1, 2, 4]
	 */
	function uniq(
		// The array to operate on.
		array){
		if(!Array.isArray(array ))
			array = this

		var unique = []

		for(var index = 0; index < array.length; index += 1)
			if(!unique.contains(array[index]))
				unique.push(array[index])

		// A new array containing the elements of `array`, excluding duplicate
		// entries.
		return unique
	}

	/**
	 * Get only the unique elements of an array. Uniqueness is determined by 
	 * first calling the provided 'get' function on the array elements and then
	 * by strict (===) equality comparison of the results.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.uniqBy(function (i) { return i.a }, [{a: 1}, {a: 2}, {a: 2}, {a: 4}])
	 *	// -> [{a: 1}, {a: 2}, {a: 4}]
	 *
	 * The property 'uniqBy' is provided on Arrays and is an alias to fn.uniqBy.
	 *
	 * Example:
	 *
	 * 	[{a: 1}, {a: 2}, {a: 2}, {a: 4}].uniqBy(function (i) { return i.a })
	 *	// -> [{a: 1}, {a: 2}, {a: 4}]
	 */
	function uniqBy(get, array){
		if(!Array.isArray(array ))
			array = this

		var unique = []

		for(var index = 0; index < array.length; index += 1)
			if(undefined === unique.find(function(elm){
					return get(elm) === get(array[index])
				}))
				unique.push(array[index])

		return unique
	}

	/**
	 * Remove a value from an array. Returns a new array with the first matching
	 * value, based on strict (===) equality, excluded.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.del(4, [1, 2, 2, 4])
	 *	// -> [1, 2, 2]
	 * 	fn.del(2, [1, 2, 2, 4])
	 *	// -> [1, 2, 4]
	 * 	fn.del(5, [1, 2, 2, 4])
	 *	// -> [1, 2, 2, 4]
	 *
	 * The property 'del' is provided on Arrays and is an alias to fn.del.
	 *
	 * Example:
	 *
	 * 	[1, 2, 2, 4].del(2)
	 *	// -> [1, 2, 4]
	 */
	function del(value, array){
		if(!Array.isArray(array ))
			array = this

		var without = []
		var found = false

		for(var index = 0; index < array.length; index += 1)
			if(!found && array[index] === value)
				found = true
			else
				without.push(array[index])

		return without
	}

	/**
	 * Remove value passing a test from an array. Returns a new array with the
	 * first for which the provided function returns truthy excluded.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.delBy(function (i) { return i%2 }, [1, 2, 2, 4])
	 *	// -> [1, 2, 4]
	 *
	 * The property 'delBy' is provided on Arrays and is an alias to fn.delBy.
	 *
	 * Example:
	 *
	 *
	 * 	[1, 2, 2, 4].del(function (i) { return i%2 })
	 *	// -> [1, 2, 4]
	 */
	function delBy(get, array){
		if(!Array.isArray(array ))
			array = this

		var without = []
		var found = false

		for(var index = 0; index < array.length; index += 1)
			if(!found && get(array[index]))
				found = true
			else
				without.push(array[index])

		return without
	}

	/**
	 * The set-wise union of two arrays. Returns a new array that contains all
	 * of the elements that are unique between the two arrays. The order of the
	 * elements in the new array is not gauranteed.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.union([1, 2, 2, 4], [1, 5, 3])
	 *	// -> [1, 2, 4, 5, 3]
	 *
	 * The property 'union' is provided on Arrays and is an alias to fn.union.
	 *
	 * Example:
	 *
	 *
	 * 	[1, 2, 2, 4].union([1, 5, 3])
	 *	// -> [1, 2, 4, 5, 3]
	 */
	function union(left, right){
		if(!Array.isArray(right))
			right = this

		// this is slower than hand-rolling
		return uniq(right.concat(left))
	}

	/**
	 * Flattens an array one level deep. Returns a new array, with elements that
	 * are themselves arrays interpolated into the new array. Value elements are
	 * included as-is.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.flatten([[1, 2], 3, [4, 5]])
	 *	// -> [1, 2, 3, 4, 5]
	 * 	fn.flatten([[1, [2]], 3])
	 *	// -> [1, [2], 3]
	 *
	 * The property 'flatten' is provided on Arrays and is an alias to
	 * fn.flatten.
	 *
	 * Example:
	 *
	 *
	 * 	[[1, 2], 3, [4, 5]].flatten()
	 *	// -> [1, 2, 3, 4, 5]
	 */
	function flatten(array){
		if(!Array.isArray(array ))
			array = this

		var result = []

		for(var element in array){
			element = array[element]

			if(Array.isArray(element))
				for(var index in element)
					result.push(element[index])
			else
				result.push(element)
		}

		return result
	}

	/**
	 * The opposite of Array.prototype.filter: remove elements from array that
	 * pass a test. Returns a new array with the elements of the original array
	 * except those for which the provided function returns truthy.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.reject(function (i) { return i % 2 }, [1, 2, 3, 4])
	 *	// -> [1, 3]
	 *
	 * The property 'reject' is provided on Arrays and is an alias to fn.reject.
	 *
	 * Example:
	 *
	 *
	 * 	[1, 2, 3, 4].reject(function (i) { return i % 2 })
	 *	// -> [1, 3]
	 */
	function reject(func, array){
		if(!Array.isArray(array ))
			array = this

		return array.filter(fn(fn.not, func))
	}

	/**
	 * Create an array consisting of a value repeated a number of times.
	 *
	 * Example:
	 *
	 * 	
	 * 	fn.repeat('foo', 3)
	 *	// -> ['foo', 'foo', 'foo']
	 */
	function repeat(times, value){
		var array = new Array(times)

		if(value === undefined)
			value = null

		while(--times >= 0)
			array[times] = value

		return array
	}

	/**
	 * Determine whether a value is present in an array. Returns true if the
	 * value is an element of the array.
	 *
	 * Example:
	 *
	 * 	fn.contains(3, [1, 2, 3])
	 *	// -> true
	 */
	function contains(elm, array){
		if(!Array.isArray(array ))
			array = this

		return array.indexOf(elm) > -1
	}

	Object.defineProperties(
		Array.prototype,
		{ group: { value: group }
		, cons: { value: cons }
		, pluck: { value: pluck }
		, head: { value: head }
		, tail: { value: tail }
		, init: { value: init }
		, last: { value: last }
		, take: { value: take }
		, uniq: { value: uniq }
		, uniqBy: { value: uniqBy }
		, del: { value: del }
		, delBy: { value: delBy }
		, union: { value: union }
		, flatten: { value: flatten }
		, reject: { value: reject }
		})

	if(!('contains' in Array.prototype))
		Object.defineProperty(
			Array.prototype,
			'contains',
			{ enumerable: false
			, writable: false
			, configurable: false
			, value: contains
			})

	//
	// section: Objects

	/**
	 * Get the values of all the properties of an object, i.e the opposite of
	 * Object.keys. Returns a new array containing the value of each
	 * (enumerable) property of the object. The order of the array is not
	 * gauranteed.
	 *
	 * Example:
	 *
	 * 	fn.values({a: 1, b: 2})
	 *	// -> [1, 2]
	 */
	function values(object){
		var values = []

		for(var key in object)
			values.push(object[key])

		return values
	}

	/**
	 * Get the value of a property, of an object. Returns the value of the
	 * property with that name from the object. If the property is an array, it
	 * is treated as a path to the value, retrieving each object in turn,
	 * returning the final value.
	 *
	 * Example:
	 *
	 * 	fn.prop('a', {a: 1, b: 2, c: 3})
	 *	// -> 1
	 *
	 * 	fn.prop(['a', 'b'], {a: {b: 2}, c: 3})
	 *	// -> 2
	 */
	function prop(key, object){
		var result = object

		if(key instanceof Array){
			for(var ky in key)
				result = result[key[ky]]
		}
		else{
			result = object[key]
		}

		return result
	}

	/**
	 * Get the properties of an object as key/value pairs. Returns a new array
	 * with elements for each (enumerable) property in the object. Each property
	 * is represented as a two element array whose elements are the key of
	 * property and the value of the property.
	 *
	 * Example:
	 *
	 * 	fn.pairs({a: 1, b: 2})
	 *	// -> [['a', 1], ['b', 2]]
	 */
	function pairs(object){
		var array = []

		for(var key in object)
			array.push([key, object[key]])

		return array
	}

	/**
	 * Determine whether an object is an instance of a type.
	 *
	 * Example:
	 *
	 * 	fn.is(Function, function(){ })
	 *	// -> true
	 */
	function is(type, object){
		return object instanceof type
	}

	/**
	 * Copies properties from one object to another. Returns first object, which
	 * is updated (in place) with the properties on the second, over-writing
	 * those properties in the first object if they already exist.
	 *
	 * Example:
	 *
	 * 	var obj = {a: 1}
	 * 	fn.assign(obj, {b: 2})
	 *	// -> {a: 1, b: 2}
	 *	obj.b
	 *	// -> 2
	 *
	 * 	var obj = {a: 1}
	 * 	fn.assign(obj, {a: 3, b: 2})
	 *	// -> {a: 3, b: 2}
	 *	obj.a
	 *	// -> 3
	 */
	function assign(obj, proto){
		for(var key in proto)
			obj[key] = proto[key]

		return obj
	}

	/**
	 * Determine whether an object has properties as defined by a template
	 * object. Returns true if the object matches the template. Property values
	 * are compared using strict equality (===).
	 *
	 * Example:
	 *
	 * 	fn.has({a: 1}, {a: 1, b: 2})
	 *	// -> true
	 * 	fn.has({a: 2}, {a: 1, b: 2})
	 *	// -> false
	 */
	function has(template, object){
		// TODO: make this a deep comparison
		var match = true

		for(var key in template)
			match = match && template[key] === object[key]

		return match
	}

	/**
	 * Get the values of a set of properties of an object. Returns a new array
	 * whose elements are the values of the properties named in the array.
	 *
	 * Example:
	 *
	 * 	fn.prop(['a', 'b'], {a: 1, b: 2, c: 3})
	 *	// -> [1, 2]
	 */
	function pick(keys, object){
		var picked = { }

		for(var key in keys){
			key = keys[key]

			if(key in object)
				picked[key] = object[key]
		}

		return picked
	}

	/**
	 * Like Array.prototype.forEach, call a function for each property on an
	 * object. The Function is called with the property value, key, and then the
	 * object itself as arguments.
	 *
	 * Example:
	 *
	 * 	fn.forIn(
	 * 		function(value, key, obj){
	 * 			console.log(key+': '+value)
	 * 		},
	 * 		{a: 1, b: 2})
	 */
	function forIn(func, object){
		for(key in object)
			func(object[key], key, object)
	}

	/**
	 * Similar to Array.prototype.map, map a function over the values of an
	 * object.  Returns a new object whose properties are those of the original
	 * object where the property values have been passed through the provided
	 * function.
	 *
	 * Example:
	 *
	 * 	fn.mapValues(function(i){return i + 1}, {a: 1, b: 2})
	 *	// -> {a: 2, b: 3}
	 */
	function mapValues(func, object){
		var result = { }

		for(var key in object)
			result[key] = func(object[key], key, object)

		return result
	}

	/**
	 * Returns a new object whose properties are those of the provided object
	 * for which a test function returns truthy. The test function is passed the
	 * property value, key, and the original object itself.
	 *
	 * Example:
	 *
	 * 	fn.filterValues(function(v){return v%2}, {a: 3, b: 4})
	 *	// -> {b: 4}
	 */
	function filterValues(func, object){
		var result = { }

		for(var key in object)
			if(func(object[key], key, object))
				result[key] = object[key]

		return result
	}

	/**
	 * Omit a set of properties from an object. Returns a new object with all of
	 * the properties of the provided object, expect the specified keys.
	 *
	 * Example:
	 *
	 * 	fn.omit(['a'], {a: 1, b: 2})
	 *	// -> {b: 2}
	 */
	function omit(keys, object){
		var result = { }

		for(var key in object)
			if(!keys.contains(key))
				result[key] = object[key]

		return result
	}

	//
	// section: Util

	/**
	 * Returns the value passed to it verbatim.
	 *
	 * Example:
	 *
	 * 	fn.id(3)
	 *	// -> 3
	 */
	function id(value){
		return value
	}

	/**
	 * Creates a function that always returns a particular value.
	 *
	 * Example:
	 *
	 * 	three = fn.constant(3)
	 * 	three()
	 *	// -> 3
	 * 	three(40)
	 *	// -> 3
	 */
	function constant(value){
		return function(){
			return value
		}
	}

	/**
	 * Returns try if the passed argument is a number.
	 *
	 * Example:
	 *
	 * 	fn.isNumber(3)
	 *	// -> true
	 * 	fn.isNumber("3")
	 *	// -> false
	 */
	function isNumber(value){
		return (typeof value) === 'number' || value instanceof Number
	}

	/**
	 * Converts an array-like object to an array. Returns a new array whose
	 * elements are the numeric properties of the provided collection less than
	 * the length property of the collection.
	 */
	function toArray(collection){
		var array = []

		for(var idx = 0; idx < collection.length; idx += 1)
			array[idx] = collection[idx]

		return array
	}

	/**
	 * Combines arguments with the + operator.
	 */
	function add(left, right){
		return left + right
	}

	/**
	 * Compares the arguments with the < operator.
	 */
	function less(left, right){
		return left < right
	}

	/**
	 * Compares the arguments with the > operator.
	 */
	function greater(left, right){
		return left > right
	}

	/**
	 * Combines arguments with the || operator.
	 */
	function or(left, right){
		return left || right
	}

	/**
	 * Combines arguments with the && operator.
	 */
	function and(left, right){
		return left && right
	}

	/**
	 * Negates the argument - with the - operator if the argument is a number,
	 * and with the ! operator otherwise.
	 */
	function not(value){
		return isNumber(value)? -value : !value;
	}

	/**
	 * Compares the arguments with the === operator.
	 */
	function equal(left, right){
		return left === right
	}

	/**
	 * Returns a number in the range [low, high).
	 */
	function random(low, high){
		var range = high - low

		return Math.floor(Math.random() * range + low)
	}

	var fn =
		{ curry: curry
		, compose: compose
		, flip: flip
		, trans: transform
		, asNew: asNew

		, group: group.curry
		, cons: cons.curry
		, pluck: pluck.curry
		, reverse: reverse
		, head: head
		, tail: tail
		, init: init
		, last: last
		, uniq: uniq
		, uniqBy: uniqBy.curry
		, del: del.curry
		, delBy: delBy.curry
		, union: union.curry
		, flatten: flatten.curry
		, reject: reject.curry
		, repeat: repeat.curry
		, contains: contains.curry

		, values: values
		, prop: prop.curry
		, pairs: pairs
		, is: is.curry
		, assign: assign.curry
		, has: has.curry
		, pick: pick.curry
		, forIn: forIn.curry
		, mapValues: mapValues.curry
		, filterValues: filterValues.curry
		, omit: omit.curry

		, id: id
		, constant: constant
		, isNumber: isNumber
		, toArray: toArray
		, add: add.curry
		, less: less.curry
		, greater: greater.curry
		, or: or.curry
		, and: and.curry
		, not: not
		, negate: not
		, eq: equal.curry
		, random: random.curry
		}

	pairs(fn).forEach(function(pair){
		compose[pair[0]] = pair[1]
	})

	this.fn = fn = compose

	try{
		module.exports = fn
	}catch(ex){}

	return fn
}(eval))
