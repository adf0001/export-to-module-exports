
//export-to-module-exports @ npm, transfer export statement to module.exports expression.

var acorn = require('acorn');
var falafel = require('falafel');

function formatSourceComment(source, options) {
	if (!options || !options.sourceComment) return "";

	return "\n//" + source.replace(/[\r\n]+/g, "\\n ") + "\n";
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
var falafelOptions = { sourceType: 'module', ecmaVersion: ECMA_VERSION };

var regFromModule = /\bfrom\s*([\'\"][^\'\"]+[\'\"])[\s;]*$/;

//seed: { id }
function exportVarName(source, seedObject) {
	if (!seedObject.id) seedObject.id = 1;

	var sid;
	while (source.indexOf(sid = "_export_" + (seedObject.id++) + "_") >= 0) { }
	return sid;
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
*/
function transfer(source, options) {
	if (!regExport.test(source)) return source;		//check keyword 'export' before calling falafel

	var aExport = [], aModuleExport = [];
	var seedObject = {};

	var resultSource = falafel(source, falafelOptions,
		function (node) {
			var itemSource, subType, items, i, imax, nm, nm2;

			switch (node.type) {
				case 'ExportNamedDeclaration':
					//console.log(node);
					itemSource = node.source();
					subType = node.declaration && node.declaration.type;

					if (!subType) {
						var moduleName = removeComment(itemSource).match(regFromModule);

						if (moduleName) {
							//export { name1, name2, …, nameN } from …;
							//export { import1 as name1, import2 as name2, …, nameN } from …;

							//export { default, … } from …;
							//	export { default as DefaultExport, … } from …;  //from example

							var varName = exportVarName(source, seedObject);

							items = node.specifiers;
							imax = items.length;
							for (i = 0; i < imax; i++) {
								nm = items[i].exported.name;
								nm2 = items[i].local.name;

								if (nm2 === "default") {
									if (nm === "default") aModuleExport.push(varName);
									else { aExport.push("exports." + nm + "= " + varName); }
								}
								else { aExport.push("exports." + nm + "= " + varName + "." + nm2); }
							}

							node.update(
								formatSourceComment(itemSource, options) +
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

								if (nm === "default") { aModuleExport.push(nm2); }
								else { aExport.push("exports." + nm + "= " + nm2); }
							}

							node.update(formatSourceComment(itemSource, options));	//remove all by comment
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

					if (node.declaration.id) {
						//export default function name1(…) { … } // also class, function*

						nm = node.declaration.id.name;
						node.update(
							formatSourceComment(itemSource.slice(0, idx), options) +
							itemSource.slice(idx)
						);
					}
					else {
						//export default expression;
						//export default function (…) { … } // also class, function*

						nm = exportVarName(source, seedObject);
						node.update(formatSourceComment(itemSource.slice(0, idx), options) +
							"var " + nm + "= " + itemSource.slice(idx)
						);
					}

					aModuleExport.push(nm);

					break;
				case 'ExportAllDeclaration':
					itemSource = node.source();

					var moduleName = removeComment(itemSource).match(regFromModule);
					if (node.exported) {
						//export * as name1 from …; // ECMAScript® 2O20

						nm = node.exported.name;
						aExport.push('exports.' + nm + '= ' + nm);
					}
					else {
						//export * from …; // does not set the default export

						nm = exportVarName(source, seedObject);
						aExport.push('for(var i in ' + nm + '){if(i!=="default")exports[i]=' + nm + '[i]}');
					}
					node.update(formatSourceComment(itemSource, options) +
						"var " + nm + "= require(" + moduleName[1] + ");"
					);

					break;
				default:
					return;
			}

			if (options && options.debugInfo) { console.log("match line: " + itemSource); }
		}
	);
	if (resultSource instanceof Error) return resultSource;

	if (options && options.sourceComment && (aModuleExport.length > 0 || aExport.length))
		resultSource += "\n//transfer export";

	if (aModuleExport.length > 0) resultSource += "\nmodule.exports= exports= " +
		aModuleExport[aModuleExport.length - 1] + ";";		//only the last one
	if (aExport.length > 0) resultSource += "\n" + aExport.join(";\n") + ";";

	return resultSource;
}

//module

module.exports = transfer;