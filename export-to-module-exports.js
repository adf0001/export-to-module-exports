
//export-to-module-exports @ npm, transfer export statement to module.exports expression.

var acorn = require('acorn');
var falafel = require('falafel');

function formatSourceComment(source, options, lineHead, lineTail) {
	if (!options || !options.sourceComment) return "";

	return (lineHead ? "" : "\n") + "//" + source.replace(/[\r\n]+/g, "\\n ") + (lineTail ? "" : "\n");
}

var ECMA_VERSION = 99;	//to avoid SyntaxError by dynamic import-calling `import()`, or other future error.

function removeComment(source) {
	var a = [], lastEnd = 0;
	try {
		acorn.parse(source, {
			sourceType: 'module', ecmaVersion: ECMA_VERSION,
			onComment: function (block, text, start, end) {
				a.push(source.slice(lastEnd, start));
				lastEnd = end;
			}
		});
	}
	catch (ex) {
		//may fail on parse partial code
		return source;
	}

	if (!a.length) return source;	//have no comment

	a.push(source.slice(lastEnd));
	return a.join(" ");		//block comment can be a splitter like a space
}

/*
refer https://262.ecma-international.org/11.0/#sec-exports

Syntax
ExportDeclaration:
	export ExportFromClause FromClause;
	export NamedExports;
	export VariableStatement[~Yield, ~Await]
	export Declaration[~Yield, ~Await]
	export default HoistableDeclaration[~Yield, ~Await, +Default]
	export default ClassDeclaration[~Yield, ~Await, +Default]
	export default [lookahead ∉ { function, async [no LineTerminator here] function, class }]
		AssignmentExpression[+In, ~Yield, ~Await];
*/

/*
refer https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

// Exporting individual features
export let name1, name2, …, nameN; // also var, const	//'const' need a '=', so it should be excluded;
export let name1 = …, name2 = …, …, nameN; // also var, const
export function functionName(){...}
export class ClassName {...}

// Export list
export { name1, name2, …, nameN };

// Renaming exports
export { variable1 as name1, variable2 as name2, …, nameN };

// Exporting destructured assignments with renaming
export const { name1, name2: bar } = o;
export const [ name1, name2 ] = array;

// Default exports
export default expression;
export default function (…) { … } // also class, function*
export default function name1(…) { … } // also class, function*
export { name1 as default, … };

// Aggregating modules
export * from …; // does not set the default export
export * as name1 from …; // ECMAScript® 2O20
export { name1, name2, …, nameN } from …;
export { import1 as name1, import2 as name2, …, nameN } from …;
export { default, … } from …;
	export { default as DefaultExport, … } from …;  //from example

*/

var regExport = /\bexport\b/;
var defaultFalafelOptions = { sourceType: 'module', ecmaVersion: ECMA_VERSION };

var regFromModule = /\bfrom\s*([\'\"][^\'\"]+[\'\"])[\s;]*$/;

//textSeedObject: { id, text }
function exportVarName(textSeedObject) {
	if (!textSeedObject.id) textSeedObject.id = 1;

	var sid;
	while (textSeedObject.text.indexOf(sid = "_export_" + (textSeedObject.id++) + "_") >= 0) { }
	return sid;
}

//return boolean
var fastCheck = function (source) {
	return regExport.test(source);
}

var regLineHead = /[\r\n]$/;
var regLineHeadMore = /(\r\r|\n\n|[\r\n]{3,})$/;

var regLineTail = /^[\r\n]/;

//return callback object { node: function(node), final: function(result) }
var falafelCallback = function (source, options) {
	var aExport = [], aModuleExport = [];
	var textSeedObject = { text: source };

	var defaultKey = options && options.defaultKey;

	return {
		node: function (node) {
			var itemSource, subType, items, i, imax, nm, nm2, lineHead, lineTail;

			switch (node.type) {
				case 'ExportNamedDeclaration':
					//console.log(node);
					itemSource = node.source();
					subType = node.declaration && node.declaration.type;

					lineHead = node.start ? regLineHead.test(source.slice(node.start - 1, node.start)) : true;

					if (!subType) {
						var moduleName = removeComment(itemSource).match(regFromModule);

						if (moduleName) {
							//export { name1, name2, …, nameN } from …;
							//export { import1 as name1, import2 as name2, …, nameN } from …;

							//export { default, … } from …;
							//	export { default as DefaultExport, … } from …;  //from example

							var varName = exportVarName(textSeedObject);

							items = node.specifiers;
							imax = items.length;
							for (i = 0; i < imax; i++) {
								nm = items[i].exported.name;
								nm2 = items[i].local.name;

								if (nm2 === "default") {
									if (nm === "default") {
										if (defaultKey) {
											aExport.push("exports." + defaultKey + "= " +
												varName + "." + defaultKey);
										}
										else {
											aModuleExport.push(varName);
										}
									}
									else {
										aExport.push("exports." + nm + "= " +
											varName + (defaultKey ? ("." + defaultKey) : ""));
									}
								}
								else { aExport.push("exports." + nm + "= " + varName + "." + nm2); }
							}

							node.update(
								formatSourceComment(itemSource, options, lineHead) +
								"var " + varName + "= require(" + moduleName[1] + ");"
							);
						}
						else {
							//export { name1, name2, …, nameN };
							//export { variable1 as name1, variable2 as name2, …, nameN };

							//export { name1 as default, … };

							items = node.specifiers;
							imax = items.length;
							for (i = 0; i < imax; i++) {
								nm = items[i].exported.name;
								nm2 = items[i].local.name;

								if (nm === "default") {
									if (defaultKey) { aExport.push("exports." + defaultKey + "= " + nm2); }
									else { aModuleExport.push(nm2); }
								}
								else { aExport.push("exports." + nm + "= " + nm2); }
							}

							lineTail = node.end ? regLineTail.test(source.slice(node.end, node.end + 1)) : false;
							
							node.update(formatSourceComment(itemSource, options, lineHead, lineTail));	//remove all by comment
						}

						break;	//skip header processing
					}
					else if (subType === "VariableDeclaration") {
						var declareType = node.declaration.declarations[0].id.type;

						if (declareType === "ObjectPattern") {
							//export const { name1, name2: bar } = o;

							items = node.declaration.declarations[0].id.properties;
							imax = items.length;
							for (i = 0; i < imax; i++) {
								nm = items[i].value.name;
								aExport.push("exports." + nm + "= " + nm);
							}
						}
						else if (declareType === "ArrayPattern") {
							//export const [ name1, name2 ] = array;

							items = node.declaration.declarations[0].id.elements;
							imax = items.length;
							for (i = 0; i < imax; i++) {
								nm = items[i].name;
								aExport.push("exports." + nm + "= " + nm);
							}
						}
						else {
							//export let name1, name2, …, nameN; // also var, const
							//export let name1 = …, name2 = …, …, nameN; // also var, const

							items = node.declaration.declarations;
							imax = items.length;
							for (i = 0; i < imax; i++) {
								nm = items[i].id.name;
								aExport.push("exports." + nm + "= " + nm);
							}
						}
					}
					else if (subType === "FunctionDeclaration" || subType === "ClassDeclaration") {
						//export function functionName(){...}
						//export class ClassName {...}

						nm = node.declaration.id.name;
						aExport.push("exports." + nm + "= " + nm);
					}
					else return;

					//header processing
					var newSource = itemSource.replace(/^export\b/, "/*export*/");
					if (newSource && itemSource !== newSource) { node.update(newSource); }

					break;
				case 'ExportDefaultDeclaration':
					itemSource = node.source();
					var idx = node.declaration.start - node.start;

					lineHead = node.start ? regLineHead.test(source.slice(node.start - 1, node.start)) : true;

					if (node.declaration.id) {
						//export default function name1(…) { … } // also class, function*

						nm = node.declaration.id.name;
						node.update(
							formatSourceComment(itemSource.slice(0, idx), options, lineHead) +
							itemSource.slice(idx)
						);
					}
					else {
						//export default expression;
						//export default function (…) { … } // also class, function*

						nm = exportVarName(textSeedObject);
						node.update(formatSourceComment(itemSource.slice(0, idx), options, lineHead) +
							"var " + nm + "= " + itemSource.slice(idx)
						);
					}

					if (defaultKey) { aExport.push("exports." + defaultKey + "= " + nm); }
					else { aModuleExport.push(nm); }

					break;
				case 'ExportAllDeclaration':
					itemSource = node.source();

					lineHead = node.start ? regLineHead.test(source.slice(node.start - 1, node.start)) : true;

					var moduleName = removeComment(itemSource).match(regFromModule);
					if (node.exported) {
						//export * as name1 from …; // ECMAScript® 2O20

						nm = node.exported.name;
						aExport.push('exports.' + nm + '= ' + nm);
					}
					else {
						//export * from …; // does not set the default export

						nm = exportVarName(textSeedObject);
						aExport.push(
							'for(var i in ' + nm + '){' +
							(defaultKey ? ('if(i!=="' + defaultKey + '")') : '') +
							'exports[i]=' + nm + '[i]}'
						);
					}
					node.update(formatSourceComment(itemSource, options, lineHead) +
						"var " + nm + "= require(" + moduleName[1] + ");"
					);

					break;
				default:
					return;
			}

			if (options && options.debugInfo) { console.log("match line: " + itemSource); }
		},

		final: function (result) {
			if (!result || (result instanceof Error)) return result;

			result = result.toString();

			if (options && options.sourceComment && (aModuleExport.length > 0 || aExport.length))
				result += (regLineHeadMore.test(result) ? "" : "\n") + "//transfer export";

			if (aModuleExport.length > 0) result += "\nmodule.exports= exports= " +
				aModuleExport[aModuleExport.length - 1] + ";";		//only the last one
			if (aExport.length > 0) result += "\n" + aExport.join(";\n") + ";";

			return result;
		},
	};
}

/*
options:
	.debugInfo
		show debug information
	.sourceComment
		add source comment
	.defaultKey
		default is empty, and the default export is same as name-space export, such as in node.js;
		it can be appointed a string key,
			such as "default" like that in babel, then the default export is `require("module").default`;
	.falafelOptions
		options passed to falafel, default { sourceType: 'module', ecmaVersion: 99 };
*/
function transfer(source, options) {
	if (!fastCheck(source)) return source;

	var cbo = falafelCallback(source, options);

	var resultSource = falafel(source, (options && options.falafelOptions) || defaultFalafelOptions, cbo.node);

	return cbo.final(resultSource).toString();
}

//module

module.exports = exports = transfer;

exports.fastCheck = fastCheck;
exports.falafelCallback = falafelCallback;
exports.defaultFalafelOptions = Object.assign({}, defaultFalafelOptions);
