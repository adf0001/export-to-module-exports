
export var name1;
export let name1b, name2 = 2;
export const name1c = 1, name2b = 2;
export function functionName() { };
export class ClassName { };

var name1d, name2c;
export { name1d, name2c };

var variable1, variable2;
export { variable1 as name1e, variable2 as name2d };

var o = { name1ee: 1 };
export const { name1ee, name2: bar } = o;

var arr = [1, 2];
export const [name1f, name2e] = arr;

export default { a : 4 + 1 };		//accept only 1 default, manually toggle this line;

//export default function () { };		//accept only 1 default, manually toggle this line;

//export default class { };		//accept only 1 default, manually toggle this line;

//export default function* () { };		//accept only 1 default, manually toggle this line;

//export default function func1() { };		//accept only 1 default, manually toggle this line;

//export default class cls1 { };		//accept only 1 default, manually toggle this line;

//export default function* func1() { };		//accept only 1 default, manually toggle this line;

//var name1g = {}, name2; export { name1g as default, name2f };		//accept only 1 default, manually toggle this line;

export * from "module-name";

export
	*/*from*/ from "module-name"/*"mmm"*/;//special spaces

export * as name1h from "module-name";

export { name1i, name2g } from "module-name";

export { import1 as name1j, import2 as name2h } from "module-name";

//export { default, name1k } from "module-name";		//accept only 1 default, manually toggle this line;

export { default as DefaultExport, name1m as exp1 } from "module-name";
