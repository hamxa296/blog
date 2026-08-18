import { deserializeContent } from './src/types/blockTypes';

const payload1 = '[{"id":"m3nq79jd","type":"paragraph","data":{"html":"haha lol "}},{"id":"eeywu2yx","type":"callout","data":{"variant":"tip","text":"life is life"}},{"id":"y3vruow4","type":"cta","data":{"headline":"haha lol","body":"","buttonLabel":"Learn More","buttonUrl":"","variant":"solid"}},{"id":"qvtqn1j9","type":"divider","data":{"style":"dots"}},{"id":"9g1udiqc","type":"quote","data":{"text":"quote","attribution":"attribute"}},{"id":"ka91ngk1","type":"paragraph","data":{"html":"para text"}}]';

console.log(JSON.stringify(deserializeContent(payload1), null, 2));
