Funfun
==

I love Underscore and Lodash -- having a lot of the operations I'm used to from
functional languages like Lisp and Haskell available in JavaScript is wonderful.
Still, they leave a lot to be desired. 'Wrapping' objects is clunky and makes it
difficult to mix non-Underscore functions into a chain of wrapped calls.
Composing Underscore functions is a pain. The function interfaces contain a lot
of magic -- magic it would be nice to leverage ourselves!

Funfun is an attempt to provide functional operations like Underscore and
Lodash, but in a way that provides easy function composition and reuse, takes
advantage of new ES6 functionality to integration with existing types, and allow
library users to leverage some of that "magic" themselves.

Take a look at the overview below or check out the
[API documention](http://faboo.github.io/Funfun/documention/documention.html).

Legal
--

Funfun, or fn.js, copyright 2015 Ray Wallace III

You may use this library (and its associated documentation) under the terms of
the MIT License. See LICENSE.

Currying and Composition
--

The biggest tools Funfun provides are automated currying and easy function
composition. Functions have a property, `curry`, that is a auto-curried version
of the function:

	function add(left, right){
		return left + right
	}

	[1, 2, 3].map(add.curry(1))
	// -> [2, 3, 4]

Additionally, the `fn` object can be called as a function to compose two or more
functions:

	function not(num){
		return -num
	}

	[1, 2, 3].map(fn(not, add.curry(1)))
	// -> [-2, -3, -4]

Or, using Funfun's functions:

	[1, 2, 3].map(fn(fn.not, fn.add(1)))
	// -> [-2, -3, -4]

Notice how `add.curry` becomes `fn.add`. All of the Funfun's functions are
already curried -- even generated functions like the result of composition. We
could tweak the above example like this:

	[1, 2, 3].map(fn(fn.not, fn.add)(1))
	// -> [-2, -3, -4]


Leaning on JavaScript
--

The modern JavaScript Array type has a good start on methods for working with
them in a functional manner: map, filter, reduce, and a few others. Funfun adds
more of what we'd expect, like reject and pluck. These additions are added to
JavaScript's built-in array type, so they can be used just like the native
functions. The same functions are also available, in curried form, on the `fn`
object:

	[1, 2, 3].cons(0)
	// -> [0, 1, 2, 3]

	[[3, 4], [4, 6], [3, 5]].map(fn.cons(2))
	// -> [[2, 3, 4], [2, 4, 6], [2, 3, 5]]


You might note, if you're used to Underscore and Lodash, that the parameter
order for `cons` looks backward. While Underscore unwrapped functions always put
the array (or plain object) *first*, Funfun puts them *last*. This is to make it
simpler to use a partially applied version of a function with `map` or
`forEach`, like you see above. Consider this Underscore example:

	_.map(
		[{a: 1, b: 2}, {a: 2, b: 3}],
		_.partialRight(_.omit, ['a']))
	// -> [{b: 2}, {b: 3}]

And compare it to the same thing with Funfun:

	[{a: 1, b: 2}, {a: 2, b: 3}].map(fn.omit, ['a'])
	// -> [{b: 2}, {b: 3}]

Of course, we aren't always lucky with parameter order. For that, Funfun
provides `flip`:

	var smallPrimes = [2, 3, 5, 7, 11, 13, 17, 23, 29, 37, 41, 43]
	var integers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
	
	integers.filter(fn.contains.flip(smallPrimes))
	// -> [2, 3, 5, 7]


A Little Magic
---

Lodash, in particular, has quite a bit of 'magic'. For instance, it's the
"\_.where style callback" is quite nice, and can be used in a number of useful
places where you might otherwise use a predicate function:
	
	var objects = [{a: 1, b: 2}, {a: 2, b: 2}]

	_.where(objects, {a: 1})
	// -> [{a: 1, b: 2}]
	_.reject(objects, {a: 1})
	// -> [{a: 2, b: 2}]

Funfun doesn't have a special object-as-predicate interpretation of arguments,
but you can get the same effect using `has`<sup id="ref1"><a
href="#note1">1</a></sup>:

	var objects = [{a: 1, b: 2}, {a: 2, b: 2}]

	fn.has({a: 1}, objects[0])
	// -> true
	fn.has({a: 1}, objects[1])
	// -> false

	objects.filter(fn.has({a: 1}))
	// -> [{a: 1, b: 2}]

	objects.reject(fn.has({a: 1}))
	// -> [{a: 2, b: 2}]

Lodash as provides '"\_.pluck" style callbacks', which we can emulate in Funfun
with `prop`:

	fn.prop('a', {a: 0, b: 1})
	// -> 0

	[{a: 1, b: 2}, {a: 0, b: 1}].filter(fn.prop('a'))
	// -> [{a: 1, b: 2}]

	[{a: 2, b: 2}, {a: 1, b: 1}].filter(fn(fn.less.flip(2), fn.prop('a')))
	// -> [{a: 1, b: 1}]

endnotes
--

<span id="note1"><a href="#ref1">1</a></span> Both Underscore and Lodash of
functions named `has`, but they're used different.
