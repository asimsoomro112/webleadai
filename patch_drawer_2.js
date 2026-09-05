const fs = require('fs');
let code = fs.readFileSync('components/LeadDetailDrawer.tsx', 'utf8');

// Assistant
code = code.replace(
  /body: JSON\.stringify\(\{\s*leadId: lead\.id,\s*question: questionText,\s*\}\)/g,
  'body: JSON.stringify({ lead, settings, query: questionText })'
);

// Reply
code = code.replace(
  /body: JSON\.stringify\(\{\s*leadId: lead\.id,\s*action: 'accept',\s*\}\)/g,
  "body: JSON.stringify({ lead, settings, action: 'accept' })"
);
code = code.replace(
  /body: JSON\.stringify\(\{\s*leadId: lead\.id,\s*action: 'reject',\s*\}\)/g,
  "body: JSON.stringify({ lead, settings, action: 'reject' })"
);
code = code.replace(
  /body: JSON\.stringify\(\{\s*leadId: lead\.id,\s*action: 'objection',\s*objection: objectionText,\s*\}\)/g,
  "body: JSON.stringify({ lead, settings, action: 'objection', objection: objectionText })"
);

// Handoff
code = code.replace(
  /body: JSON\.stringify\(\{\s*leadId: lead\.id,\s*instructions: customInstructions,\s*\}\)/g,
  'body: JSON.stringify({ lead, settings, instructions: customInstructions })'
);

fs.writeFileSync('components/LeadDetailDrawer.tsx', code);
