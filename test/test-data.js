
//global variable, for html page, refer tpsvr @ npm.
export_to_module_exports = require("../export-to-module-exports.js");
falafel = require('falafel');

module.exports = {

	"transfer()": function (done) {
		//if (typeof window !==/=== "undefined") throw "disable for browser/nodejs";

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
					.falafelOptions
						options passed to falafel, default { sourceType: 'module', ecmaVersion: 99 };
			*/
			var s = export_to_module_exports(source, { sourceComment: true, debugInfo: true });
			if (s === expect) return true;
			console.error("compare fail, source: " + source);
			console.log("expect: " + expect);
			console.log("result: " + s);
			return false;
		}

		done(!(

			cmp('export var name1;',
				'/*export*/ var name1;\n' +
				'//transfer export\n' +
				'exports.name1= name1;') &&

			cmp('export let name1, name2=2;',
				'/*export*/ let name1, name2=2;\n' +
				'//transfer export\n' +
				'exports.name1= name1;\n' +
				'exports.name2= name2;') &&

			cmp('export const name1=1, name2=2;',
				'/*export*/ const name1=1, name2=2;\n' +
				'//transfer export\n' +
				'exports.name1= name1;\n' +
				'exports.name2= name2;') &&

			cmp('export function functionName(){};',
				'/*export*/ function functionName(){};\n' +
				'//transfer export\n' +
				'exports.functionName= functionName;') &&

			cmp('export class ClassName {};',
				'/*export*/ class ClassName {};\n' +
				'//transfer export\n' +
				'exports.ClassName= ClassName;') &&

			cmp('var name1, name2; export { name1, name2 };',
				'var name1, name2; \n' +
				'//export { name1, name2 };\n' +
				'\n' +
				'//transfer export\n' +
				'exports.name1= name1;\n' +
				'exports.name2= name2;') &&

			cmp('var name1, name2; export { name1, name2 };\n',
				'var name1, name2; \n' +
				'//export { name1, name2 };\n' +
				'\n' +
				'//transfer export\n' +
				'exports.name1= name1;\n' +
				'exports.name2= name2;') &&

			cmp('var name1, name2; export { name1, name2 };\nvar b=1;',
				'var name1, name2; \n' +
				'//export { name1, name2 };\n' +
				'var b=1;\n' +
				'//transfer export\n' +
				'exports.name1= name1;\n' +
				'exports.name2= name2;') &&

			cmp('var variable1, variable2; export { variable1 as name1, variable2 as name2 };',
				'var variable1, variable2; \n' +
				'//export { variable1 as name1, variable2 as name2 };\n' +
				'\n' +
				'//transfer export\n' +
				'exports.name1= variable1;\n' +
				'exports.name2= variable2;') &&

			cmp('var o={name1:1}; export const { name1, name2: bar } = o;',
				'var o={name1:1}; /*export*/ const { name1, name2: bar } = o;\n' +
				'//transfer export\n' +
				'exports.name1= name1;\n' +
				'exports.bar= bar;') &&

			cmp('var arr=[1,2]; export const [ name1, name2 ] = arr;',
				'var arr=[1,2]; /*export*/ const [ name1, name2 ] = arr;\n' +
				'//transfer export\n' +
				'exports.name1= name1;\n' +
				'exports.name2= name2;') &&

			cmp('export default 4+1;',
				'//export default \n' +
				'var _export_1_= 4+1;\n' +
				'//transfer export\n' +
				'module.exports= exports= _export_1_;') &&

			cmp('export default function(){/*test var name _export_1_*/};',
				'//export default \n' +
				'var _export_2_= function(){/*test var name _export_1_*/};\n' +
				'//transfer export\n' +
				'module.exports= exports= _export_2_;') &&

			cmp('export default class{};',
				'//export default \n' +
				'var _export_1_= class{};\n' +
				'//transfer export\n' +
				'module.exports= exports= _export_1_;') &&

			cmp('export default function*(){};',
				'//export default \n' +
				'var _export_1_= function*(){};\n' +
				'//transfer export\n' +
				'module.exports= exports= _export_1_;') &&

			cmp('export default function func1(){};',
				'//export default \n' +
				'function func1(){};\n' +
				'//transfer export\n' +
				'module.exports= exports= func1;') &&

			cmp('export default class cls1{};',
				'//export default \n' +
				'class cls1{};\n' +
				'//transfer export\n' +
				'module.exports= exports= cls1;') &&

			cmp('export default function * func1(){};',
				'//export default \n' +
				'function * func1(){};\n' +
				'//transfer export\n' +
				'module.exports= exports= func1;') &&

			cmp('var name1={}, name2; export { name1 as default, name2 };',
				'var name1={}, name2; \n' +
				'//export { name1 as default, name2 };\n' +
				'\n' +
				'//transfer export\n' +
				'module.exports= exports= name1;\n' +
				'exports.name2= name2;') &&

			cmp('export * from "module-name";',
				'//export * from "module-name";\n' +
				'var _export_1_= require("module-name");\n' +
				'//transfer export\n' +
				'for(var i in _export_1_){exports[i]=_export_1_[i]};') &&

			cmp('export\n' +
				'*/*from*/from"module-name"/*"mmm"*/;//special spaces',
				'//export\\n */*from*/from"module-name"/*"mmm"*/;\n' +
				'var _export_1_= require("module-name");//special spaces\n' +
				'//transfer export\n' +
				'for(var i in _export_1_){exports[i]=_export_1_[i]};') &&

			cmp('export * as name1 from "module-name";',
				'//export * as name1 from "module-name";\n' +
				'var name1= require("module-name");\n' +
				'//transfer export\n' +
				'exports.name1= name1;') &&

			cmp('export * as name1 from "module-name";\n',
				'//export * as name1 from "module-name";\n' +
				'var name1= require("module-name");\n' +
				'\n' +
				'//transfer export\n' +
				'exports.name1= name1;') &&
			cmp('export * as name1 from "module-name";\n\n',
				'//export * as name1 from "module-name";\n' +
				'var name1= require("module-name");\n' +
				'\n' +
				'//transfer export\n' +
				'exports.name1= name1;') &&
			cmp('export * as name1 from "module-name";\n\n\n',
				'//export * as name1 from "module-name";\n' +
				'var name1= require("module-name");\n' +
				'\n\n' +
				'//transfer export\n' +
				'exports.name1= name1;') &&

			cmp('export { name1, name2 } from "module-name";',
				'//export { name1, name2 } from "module-name";\n' +
				'var _export_1_= require("module-name");\n' +
				'//transfer export\n' +
				'exports.name1= _export_1_.name1;\n' +
				'exports.name2= _export_1_.name2;') &&

			cmp('export { import1 as name1, import2 as name2 } from "module-name";',
				'//export { import1 as name1, import2 as name2 } from "module-name";\n' +
				'var _export_1_= require("module-name");\n' +
				'//transfer export\n' +
				'exports.name1= _export_1_.import1;\n' +
				'exports.name2= _export_1_.import2;') &&

			cmp('export { default, name1 } from "module-name";',
				'//export { default, name1 } from "module-name";\n' +
				'var _export_1_= require("module-name");\n' +
				'//transfer export\n' +
				'module.exports= exports= _export_1_;\n' +
				'exports.name1= _export_1_.name1;') &&

			cmp(' export { default as DefaultExport, name1 as exp1 } from "module-name";',
				' \n' +
				'//export { default as DefaultExport, name1 as exp1 } from "module-name";\n' +
				'var _export_1_= require("module-name");\n' +
				'//transfer export\n' +
				'exports.DefaultExport= _export_1_;\n' +
				'exports.exp1= _export_1_.name1;') &&

			true
		));
	},

	"options.defaultKey": function (done) {
		//if (typeof window !==/=== "undefined") throw "disable for browser/nodejs";

		function cmp(source, expect) {
			var s = export_to_module_exports(source,
				{ sourceComment: true, debugInfo: true, defaultKey: "default" });
			if (s === expect) return true;
			console.error("compare fail, source: " + source);
			console.log("expect: " + expect);
			console.log("result: " + s);
			return false;
		}

		done(!(

			cmp('export default 4+1;',
				'//export default \n' +
				'var _export_1_= 4+1;\n' +
				'//transfer export\n' +
				'exports.default= _export_1_;') &&

			cmp('export default function(){};',
				'//export default \n' +
				'var _export_1_= function(){};\n' +
				'//transfer export\n' +
				'exports.default= _export_1_;') &&

			cmp('export default class{};',
				'//export default \n' +
				'var _export_1_= class{};\n' +
				'//transfer export\n' +
				'exports.default= _export_1_;') &&

			cmp('export default function*(){};',
				'//export default \n' +
				'var _export_1_= function*(){};\n' +
				'//transfer export\n' +
				'exports.default= _export_1_;') &&

			cmp('export default function func1(){};',
				'//export default \n' +
				'function func1(){};\n' +
				'//transfer export\n' +
				'exports.default= func1;') &&

			cmp('export default class cls1{};',
				'//export default \n' +
				'class cls1{};\n' +
				'//transfer export\n' +
				'exports.default= cls1;') &&

			cmp('export default function * func1(){};',
				'//export default \n' +
				'function * func1(){};\n' +
				'//transfer export\n' +
				'exports.default= func1;') &&

			cmp('var name1={}, name2; export { name1 as default, name2 };',
				'var name1={}, name2; \n' +
				'//export { name1 as default, name2 };\n' +
				'\n' +
				'//transfer export\n' +
				'exports.default= name1;\n' +
				'exports.name2= name2;') &&

			cmp('export * from "module-name";',
				'//export * from "module-name";\n' +
				'var _export_1_= require("module-name");\n' +
				'//transfer export\n' +
				'for(var i in _export_1_){if(i!=="default")exports[i]=_export_1_[i]};') &&

			cmp('export\n' +
				'*/*from*/from"module-name"/*"mmm"*/;//special spaces',
				'//export\\n */*from*/from"module-name"/*"mmm"*/;\n' +
				'var _export_1_= require("module-name");//special spaces\n' +
				'//transfer export\n' +
				'for(var i in _export_1_){if(i!=="default")exports[i]=_export_1_[i]};') &&

			cmp('export { default, name1 } from "module-name";',
				'//export { default, name1 } from "module-name";\n' +
				'var _export_1_= require("module-name");\n' +
				'//transfer export\n' +
				'exports.default= _export_1_.default;\n' +
				'exports.name1= _export_1_.name1;') &&

			cmp('export { default as DefaultExport, name1 as exp1 } from "module-name";',
				'//export { default as DefaultExport, name1 as exp1 } from "module-name";\n' +
				'var _export_1_= require("module-name");\n' +
				'//transfer export\n' +
				'exports.DefaultExport= _export_1_.default;\n' +
				'exports.exp1= _export_1_.name1;') &&

			true
		));
	},

	"sample file": function (done) {
		//if (typeof window !== "undefined") throw "disable for browser";
		var fn = __dirname + "/sample/sample.js", txt;
		try {
			var fs = require("fs");
			txt = fs.readFileSync(fn);
		}
		catch (ex) {
			var request = new XMLHttpRequest();
			request.open('GET', 'sample/sample.js', false);
			request.send(null);
			if (request.status === 200) txt = request.responseText;
		}

		console.log("===========================");
		var rsl = export_to_module_exports(txt, { debugInfo: true, sourceComment: true });

		console.log("---------------------------");
		console.log(rsl);

		done(false);
	},
	"sample file / falafel callback": function (done) {
		//if (typeof window !== "undefined") throw "disable for browser";

		var fn = __dirname + "/sample/sample.js", txt;
		try {
			var fs = require("fs");
			txt = fs.readFileSync(fn);
		}
		catch (ex) {
			var request = new XMLHttpRequest();
			request.open('GET', 'sample/sample.js', false);
			request.send(null);
			if (request.status === 200) txt = request.responseText;
		}

		//.fastCheck(source)		//return boolean
		if (export_to_module_exports.fastCheck(txt)) {

			/*
			.falafelCallback(source, options)
			return callback object { node: function(node), final?: function(result) }
			*/
			var cbo = export_to_module_exports.falafelCallback(txt,
				{ debugInfo: true, sourceComment: false, defaultKey: "default" });

			console.log("===========================");
			var rsl = falafel(txt, export_to_module_exports.defaultFalafelOptions,
				function (node) {
					cbo.node(node);
				}
			);
			if (cbo.final) rsl = cbo.final(rsl);

			console.log("---------------------------");
			console.log(rsl.toString());

		}

		done(false);
	},

};

// for html page
if (typeof setHtmlPage === "function") setHtmlPage("", "12em");	//page setting
if (typeof showResult !== "function") showResult = function (text) { console.log(text); }

//for mocha
if (typeof describe === "function") describe('export_to_module_exports', function () { for (var i in module.exports) { it(i, module.exports[i]).timeout(5000); } });
