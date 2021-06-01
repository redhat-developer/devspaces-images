const recast = require('recast');
const types = require('ast-types');
const compose = require('recast/lib/util').composeSourceMaps;
const loaderUtils = require("loader-utils");
const b = types.builders;

function sniff(content) {
	return content.indexOf('var v = factory(require, exports);') > -1;
}

function sniffDownEmittedImport(content) {
	return content.indexOf('__syncRequire ? Promise.resolve().then') > -1;
}

function matches(arr) {
	const allowed = [ 'require', 'exports' ];
	if (arr.length !== allowed.length) return;
	return arr.every((item, i) => allowed[i] === item.name);
}

function isDefine(path) {
	return path.node.callee.name === 'define';
}

function isDownEmittedImportBlock(path) {
	return (path.node.test && path.node.test.name === '__syncRequire');
}

function convert(content, sourceMap, amd, imports, context) {
	let defineCall;
	const args = {};
	const importsFunc = typeof imports === 'function' ? imports : (module) => module;

	if (sourceMap) {
		args.sourceFileName = sourceMap.file
	}

	const ast = recast.parse(content, args);

	const visitors = {
		visitFunctionExpression(path) {
			const params = path.node.params;
			if (matches(params)) {
				const body = ast.program.body;
				body.pop();
				if (amd) {
					defineCall.arguments[1] = path.node;
					ast.program.body = [ ...body, b.expressionStatement(defineCall) ];
				} else {
					ast.program.body = [ ...body, ...path.node.body.body ];
				}
				if (!imports || !sniffDownEmittedImport(content)) {
					this.abort();
				}
			}
			this.traverse(path);
		}
	};

	if (amd) {
		visitors.visitCallExpression = function (path) {
			if (isDefine(path)) {
				defineCall = path.node;
			}
			this.traverse(path);
		}
	}

	if (imports) {
		visitors.visitConditionalExpression = function (path) {
			if (isDownEmittedImportBlock(path)) {
				const res = path.node.consequent.arguments[0].body.body[0];
				if (res.argument.callee.name === 'require') {
					const module = res.argument.arguments[0].value;
					res.argument.arguments[0] = b.literal(importsFunc(module, context));
					res.argument = b.callExpression(res.argument, []);
					path.node.alternate = b.literal(false);
				}
			}
			this.traverse(path);
		}
	}

	types.visit(ast, visitors);
	return ast;
}

module.exports = function(content, sourceMap) {
	const options = loaderUtils.getOptions(this) || {};
	this.cacheable && this.cacheable();

	if (sniff(content)) {
		const ast = convert(content, sourceMap, options.amd, options.imports, this.context);
		if(sourceMap) {
			const result = recast.print(ast, { sourceMapName: sourceMap.file });
			const map = compose(sourceMap, result.map);
			this.callback(null, result.code, map);
			return;
		}
		return recast.print(ast).code;
	}

	if (sourceMap) {
		this.callback(null, content, sourceMap);
		return;
	}
	return content;
}
