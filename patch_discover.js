const fs = require('fs');
let code = fs.readFileSync('components/DiscoveryEngine.tsx', 'utf8');

code = code.replace(
  'interface DiscoveryEngineProps {',
  "import { AppSettings } from '@/lib/types';\n\ninterface DiscoveryEngineProps {\n  settings?: AppSettings | null;"
);

code = code.replace(
  'export function DiscoveryEngine({ onLeadsDiscovered, onSelectLead }: DiscoveryEngineProps) {',
  'export function DiscoveryEngine({ onLeadsDiscovered, onSelectLead, settings }: DiscoveryEngineProps) {'
);

code = code.replace(
  /JSON\.stringify\(\{([\s\S]*?)\}\),/,
  'JSON.stringify({$1, settings}),'
);

fs.writeFileSync('components/DiscoveryEngine.tsx', code);
