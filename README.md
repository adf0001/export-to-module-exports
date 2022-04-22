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
