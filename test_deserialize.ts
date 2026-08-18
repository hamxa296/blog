import { deserializeContent } from './src/types/blockTypes';

const payload = '[{"id":"e7xnjyeo","type":"paragraph","data":{"html":""}},{"id":"bigjsa7q","type":"paragraph","data":{"html":"hahaha"}},{"id":"y49tyjok","type":"heading","data":{"text":"ahahaha","level":2}},{"id":"lk0za5xa","type":"callout","data":{"variant":"fun","text":"hahahha"}},{"id":"w00xu0ls","type":"divider","data":{"style":"line"}},{"id":"qw4kkkct","type":"cta","data":{"headline":"","body":"","buttonLabel":"Learn More","buttonUrl":"","variant":"glow"}},{"id":"60vrz5lg","type":"quote","data":{"text":"quote","attribution":"hamza"}}]';

console.log(JSON.stringify(deserializeContent(payload), null, 2));
