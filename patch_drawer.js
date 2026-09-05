const fs = require('fs');
let code = fs.readFileSync('components/LeadDetailDrawer.tsx', 'utf8');

code = code.replace(
  'interface LeadDetailDrawerProps {',
  `import { AppSettings } from '@/lib/types';\n\ninterface LeadDetailDrawerProps {\n  settings?: AppSettings | null;`
);

code = code.replace(
  'export function LeadDetailDrawer({',
  'export function LeadDetailDrawer({\n  settings,'
);

code = code.replace(
  /body: JSON\.stringify\(\{ leadId: lead\.id \}\)/g,
  'body: JSON.stringify({ lead, settings })'
);

code = code.replace(
  /body: JSON\.stringify\(\{ leadId: lead\.id, query: questionText \}\)/g,
  'body: JSON.stringify({ lead, settings, query: questionText })'
);

code = code.replace(
  /body: JSON\.stringify\(\{ leadId: lead\.id, action: 'accept' \}\)/g,
  "body: JSON.stringify({ lead, settings, action: 'accept' })"
);

code = code.replace(
  /body: JSON\.stringify\(\{ leadId: lead\.id, action: 'reject' \}\)/g,
  "body: JSON.stringify({ lead, settings, action: 'reject' })"
);

code = code.replace(
  /body: JSON\.stringify\(\{ leadId: lead\.id, action: 'objection', objection: /g,
  "body: JSON.stringify({ lead, settings, action: 'objection', objection: "
);

code = code.replace(
  /body: JSON\.stringify\(\{ leadId: lead\.id, instructions \}\)/g,
  'body: JSON.stringify({ lead, settings, instructions })'
);

fs.writeFileSync('components/LeadDetailDrawer.tsx', code);
