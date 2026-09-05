const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const target = "  // Discovered Leads Callback";
const replacement = `  const handleRunCycle = async () => {
    try {
      const res = await fetch('/api/agent/run-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads, settings }),
      });
      const data = await res.json();
      if (data.success && data.updatedLeads) {
        setLeads((prev) => {
          const newLeads = [...prev];
          data.updatedLeads.forEach((ul) => {
            const idx = newLeads.findIndex((l) => l.id === ul.id);
            if (idx >= 0) newLeads[idx] = ul;
            if (user) saveUserLead(user.uid, ul).catch(console.error);
          });
          return newLeads;
        });
        setActiveTab('discover');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Discovered Leads Callback`;

code = code.replace(target, replacement);
fs.writeFileSync('app/page.tsx', code);
