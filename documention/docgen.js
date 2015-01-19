console = require('console')
fs = require('fs')
marked = require('marked')
parser = require('./docparse')
fn = require('../fn')

marked.setOptions({
  highlight: function (code) {
    return require('highlight.js').highlight('javascript', code).value;
  }
});

function parse(file, arg, cssFile){
	fs.readFile(file, function(err, content){
		var text = content.toString()

		try{
			var result = parser.parse(text)

			if(arg === '--structure')
				console.log(JSON.stringify(result))

			else if(arg === '--markdown')
				console.log(toMarkdown(file, result))

			else
				console.log(toHtml(file, cssFile, result))
		}
		catch(ex){
			if(ex.line)
				console.log(file+':'+ex.line+':'+ex.column+': '+ex.message)
			else
				throw ex
		}
	})
}

function cleanComment(text){
	return text.split(/\n/g).map(function(line){
		return line.replace(/^(\s*\*)? */, '')
	}).join('\n')
}

function formatFunc(func){
	var returns = func.returns.filter(fn.id).uniq()

	var text = '<span id="'+func.name+'"></span>`'+func.name
		+ ' ( ' + func.params.map(fn.prop('name')).join(', ') + ' )` '
		+ '\n--\n'

	if(func.params.length)
		text = text
			+ '\n### Parameters: \n'
			+ func.params.map(
				function(param){
					return ' - `'+param.name+'`: '+cleanComment(param.doc||'')
				}).join('\n')
			+ '\n'

	if(returns.length)
		text = text
			+ '\n### Returns: \n'
			+ returns.map(cleanComment).join(', or ')
			+ '\n'

	text = text
		+ cleanComment(func.doc)

	return text
}

function toMarkdown(file, info){
	var md = file+'\n===\n'

	md += cleanComment(info.intro) + '\n'

	md += info.funcs.map(formatFunc).join('\n- - -\n')

	return md
}

function h(num, text, id, cls){
	return '<h'+num+(id? ' id="'+id+'"' : '')+(cls? ' class="'+cls+'"' : '')+'>'+text+'</h'+num+'>\n'
}

function a(id, text){
	var cls = arguments[2];
	return '<a href="#'+id+'"'+(cls? ' class="'+cls+'"' : '')+'>'+text+'</a>'
}

function tag(tag){
	return function(html){
		var cls = arguments[1];
		return '<'+tag+(cls? ' class="'+cls+'"' : '')+'>\n'
			+ html
			+ '</'+tag+'>\n'
	}
}

var section = tag('section')
var p = tag('p')
var div = tag('div')
var ol = tag('ol')
var li = tag('li')
var span = tag('span')
var article = tag('article')

function nav(html){
	return tag('nav')(ol(html))
}

function htmlDoc(text){
	return marked(text).replace(/<p>/, '<span>').replace(/<\/p>/, '</span>')
}

function htmlFunc(func){
	var returns = func.returns.filter(fn.id).uniq()

	var text = h(2,
		func.name + ' ( ' + func.params.map(fn.prop('name')).join(', ') + ' )',
		func.name)

	if(func.params.length)
		text = text
			+ h(3, 'Paramters')
			+ ol(
				func.params.map(
					function(param){
						return li(
							span(param.name, 'name')
							+ span(htmlDoc(cleanComment(param.doc||'')), 'doc'),
							'param')
					}).join(''))
			+ '\n'

	if(returns.length)
		text = text
			+ div(
				h(3, 'Returns') + htmlDoc(returns.map(cleanComment).join(', or ')),
				'return')
			+ '\n'

	text = text
		+ htmlDoc(cleanComment(func.doc), 'doc')

	return section(text)
}

function htmlNav(info){
	var section = null
	var sectionNav = []
	var navs = []

	function alpha(left, right){
		return left.name.toLowerCase() < right.name.toLowerCase() ? -1 : 1;
	}

	for(var item in info.funcs){
		item = info.funcs[item]

		if(item.comment){
			sectionNav.sort(alpha)
			if(section)
				navs.push(li(h(3, section)))
			navs = navs.concat(sectionNav.map(function(item){
					return li(a(item.name, item.name))
				}))
			sectionNav = []
			section = item.comment.replace(/section: (\w+)/, '$1')
		}
		else{
			sectionNav.push(item)
		}
	}

	if(sectionNav.length){
		sectionNav.sort(alpha)
		if(section)
			navs.push(li(h(3, section)))
		navs = navs.concat(sectionNav.map(function(item){
				return li(a(item.name, item.name))
			}))
	}

	return nav(navs.join('\n'))
}

function toHtml(file, cssFile, info){
	var body = article(h(1, file)
		+ htmlDoc(cleanComment(info.intro))
		+ info.funcs.filter(fn.prop('name')).map(htmlFunc).join('\n<hr>\n'))
	var nav = htmlNav(info)


	return '<!doctype html>\n<html>'
		+ '<head>\n'
		+ '<meta charset="utf-8">\n'
		+ (cssFile? '<link rel="stylesheet" type="text/css" href="'+cssFile+'">' : '')
		+ '<title>'+file+' Documention</title>'
		+ '</head>\n'
		+ '<body>\n'
		+ nav
		+ body
		+ '</body>\n'
		+ '</html>\n'
}

parse(
	process.argv[2],
	process.argv.last(),
	process.argv[3] && process.argv[3].match(/\.css$/)? process.argv[3] : undefined)
