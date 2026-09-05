const fs = require('fs');
let code = fs.readFileSync('components/DiscoveryEngine.tsx', 'utf8');

code = code.replace(
  ', settings}),',
  ', settings }),'
);

code = code.replace(
  'autoGenerateMessage,\n        , settings }),',
  'autoGenerateMessage,\n          settings\n        }),'
);

fs.writeFileSync('components/DiscoveryEngine.tsx', code);
