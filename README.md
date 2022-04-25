# export-to-module-exports
transfer export statement to module.exports expression

# Install
```
npm install export-to-module-exports
```

# Accepted format
```javascript

//refer https://262.ecma-international.org/11.0/#sec-exports
//refer https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

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

```

# Usage & Api
```javascript

var export_to_module_exports = require("export-to-module-exports");

function cmp(source, expect) {
	/*
	function transfer(source, options)
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
	var s = export_to_module_exports(source, { sourceComment: true, debugInfo: true }).toString();

	return (s === expect);
}

cmp('export let name1, name2=2;',
	'/*export*/ let name1, name2=2;\n' +
	'//transfer export\n' +
	'exports.name1= name1;\n' +
	'exports.name2= name2;')

cmp('export default function(){};',
	'\n//export default \n' +
	'var _export_1_= function(){};\n' +
	'//transfer export\n' +
	'module.exports= exports= _export_1_;')

cmp('export { name1, name2 } from "module-name";',
	'\n' +
	'//export { name1, name2 } from "module-name";\n' +
	'var _export_1_= require("module-name");\n' +
	'//transfer export\n' +
	'exports.name1= _export_1_.name1;\n' +
	'exports.name2= _export_1_.name2;')

```

# Samples
```javascript

/*export*/ var name1;
/*export*/ let name1b, name2 = 2;
/*export*/ const name1c = 1, name2b = 2;
/*export*/ function functionName() { };
/*export*/ class ClassName { };

var name1d, name2c;
//export { name1d, name2c };

var variable1, variable2;
//export { variable1 as name1e, variable2 as name2d };

var o = { name1ee: 1 };
/*export*/ const { name1ee, name2: bar } = o;

var arr = [1, 2];
/*export*/ const [name1f, name2e] = arr;

//export default
var _export_1_= { a : 4 + 1 };

//export * from "module-name";
var _export_2_= require("module-name");

//export\n      */*from*/ from "module-name"/*"mmm"*/;
var _export_3_= require("module-name");//special spaces

//export * as name1h from "module-name";
var name1h= require("module-name");

//export { name1i, name2g } from "module-name";
var _export_4_= require("module-name");

//export { import1 as name1j, import2 as name2h } from "module-name";
var _export_5_= require("module-name");

//export { default as DefaultExport, name1m as exp1 } from "module-name";
var _export_6_= require("module-name");

//transfer export
module.exports= exports= _export_1_;
exports.name1= name1;
exports.name1b= name1b;
exports.name2= name2;
exports.name1c= name1c;
exports.name2b= name2b;
exports.functionName= functionName;
exports.ClassName= ClassName;
exports.name1d= name1d;
exports.name2c= name2c;
exports.name1e= variable1;
exports.name2d= variable2;
exports.name1ee= name1ee;
exports.bar= bar;
exports.name1f= name1f;
exports.name2e= name2e;
for(var i in _export_2_){exports[i]=_export_2_[i]};
for(var i in _export_3_){exports[i]=_export_3_[i]};
exports.name1h= name1h;
exports.name1i= _export_4_.name1i;
exports.name2g= _export_4_.name2g;
exports.name1j= _export_5_.import1;
exports.name2h= _export_5_.import2;
exports.DefaultExport= _export_6_;
exports.exp1= _export_6_.name1m;

```
