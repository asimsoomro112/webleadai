const fs = require('fs');

// Fix 1: API route
let code1 = fs.readFileSync('app/api/leads/discover/route.ts', 'utf8');
code1 = code1.replace(/createdAt:.*\n/g, '');
code1 = code1.replace(/updatedAt:.*\n/g, '');
fs.writeFileSync('app/api/leads/discover/route.ts', code1);

// Fix 2: app/page.tsx
let code2 = fs.readFileSync('app/page.tsx', 'utf8');

const target1 = 'const [analytics, setAnalytics] = useState<AnalyticsMetrics | null>(null);';
const replace1 = `const analytics = useMemo(() => {
    if (!leads) return null;
    return {
      totalLeads: leads.length,
      qualifiedCount: leads.filter(l => l.status === 'QUALIFIED').length,
      contactedCount: leads.filter(l => l.status === 'CONTACTED' || l.status === 'MESSAGE_READY').length,
      proposalsSent: leads.filter(l => l.status === 'PROPOSAL_SENT').length,
      wonDeals: leads.filter(l => l.status === 'WON').length,
      revenuePipeline: leads.reduce((sum, l) => sum + (l.dealValue || 0), 0),
      revenueClosed: leads.filter(l => l.status === 'WON').reduce((sum, l) => sum + (l.dealValue || 0), 0),
    };
  }, [leads]);`;
code2 = code2.replace(target1, replace1);

const targetEffect = `  // Compute Analytics based on Leads
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
  }, [leads]);`;
code2 = code2.replace(targetEffect, '');

fs.writeFileSync('app/page.tsx', code2);
