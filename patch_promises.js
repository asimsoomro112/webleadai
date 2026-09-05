const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
  'const [leadsRes, analyticsRes, settingsRes, notifRes, agentRes, keysRes] = await Promise.all([',
  'const [leadsRes, settingsRes, notifRes, agentRes, keysRes] = await Promise.all(['
);

fs.writeFileSync('app/page.tsx', code);
