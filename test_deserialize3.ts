import { deserializeContent } from './src/types/blockTypes';

const originalPayload = '[{"id":"e7xnjyeo","type":"paragraph","data":{"html":""}},{"id":"bigjsa7q","type":"paragraph","data":{"html":"hahaha"}},{"id":"y49tyjok","type":"heading","data":{"text":"ahahaha","level":2}},{"id":"lk0za5xa","type":"callout","data":{"variant":"fun","text":"hahahha"}},{"id":"w00xu0ls","type":"divider","data":{"style":"line"}},{"id":"qw4kkkct","type":"cta","data":{"headline":"","body":"","buttonLabel":"Learn More","buttonUrl":"","variant":"glow"}},{"id":"60vrz5lg","type":"quote","data":{"text":"quote","attribution":"hamza"}}]';

const doubleStringified = JSON.stringify(originalPayload);
console.log("Input:", doubleStringified);

const result = deserializeContent(doubleStringified);
console.log("Result:", JSON.stringify(result, null, 2));

const htmlWrapped = `<p>${originalPayload}</p>`;
const legacyWrapped = JSON.stringify([{ id: 'legacy', type: 'paragraph', data: { html: originalPayload } }]);

console.log("Result HTML Wrapped:", JSON.stringify(deserializeContent(htmlWrapped), null, 2));
console.log("Result Legacy Wrapped:", JSON.stringify(deserializeContent(legacyWrapped), null, 2));

