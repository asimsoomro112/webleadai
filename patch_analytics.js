const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const targetEffect = `  // Real-time Firestore synchronization per authenticated user
  useEffect(() => {`;

const newEffect = `  // Compute Analytics based on Leads
  useEffect(() => {
    if (leads) {
      const computedAnalytics = {
        totalLeads: leads.length,
        qualifiedCount: leads.filter(l => l.status === 'QUALIFIED').length,
        contactedCount: leads.filter(l => l.status === 'CONTACTED' || l.status === 'MESSAGE_READY').length,
        proposalsSent: leads.filter(l => l.status === 'PROPOSAL_SENT').length,
        wonDeals: leads.filter(l => l.status === 'WON').length,
        revenuePipeline: leads.reduce((sum, l) => sum + (l.dealValue || 0), 0),
        revenueClosed: leads.filter(l => l.status === 'WON').reduce((sum, l) => sum + (l.dealValue || 0), 0),
      };
      setAnalytics(computedAnalytics);
    }
  }, [leads]);

  // Real-time Firestore synchronization per authenticated user
  useEffect(() => {`;

code = code.replace(targetEffect, newEffect);

// Remove the fetch('/api/analytics') block inside handleUpdateStatus
code = code.replace(/\/\/ Refresh analytics in background\n\s*fetch\('\/api\/analytics'\)\n\s*\.then\(\(r\) => r\.json\(\)\)\n\s*\.then\(\(d\) => setAnalytics\(d\.analytics\)\);/, '');

fs.writeFileSync('app/page.tsx', code);
