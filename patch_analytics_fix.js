const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const target1 = `const analytics = useMemo(() => {
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

const replace1 = `const analytics = useMemo(() => {
    if (!leads) return null;
    return {
      totalLeads: leads.length,
      newLeads: leads.filter(l => l.status === 'NEW').length,
      qualifiedLeads: leads.filter(l => l.status === 'QUALIFIED').length,
      contactedCount: leads.filter(l => l.status === 'CONTACTED' || l.status === 'MESSAGE_READY').length,
      hotLeads: leads.filter(l => l.status === 'INTERESTED').length,
      proposalsSent: leads.filter(l => l.status === 'PROPOSAL_SENT').length,
      wonDeals: leads.filter(l => l.status === 'WON').length,
      repliesCount: 0,
      objectionsCount: 0,
      meetingsBooked: leads.filter(l => l.status === 'CALL_BOOKED').length,
      revenuePipeline: leads.reduce((sum, l) => sum + (l.dealValue || 0), 0),
      revenueClosed: leads.filter(l => l.status === 'WON').reduce((sum, l) => sum + (l.dealValue || 0), 0),
      dailyTasksCompleted: 0,
      aiHoursSaved: 0,
      conversionRate: 0,
      averageDealCycleDays: 0,
      topLeadSources: [],
      projectedRevenueNextMonth: 0,
    } as any;
  }, [leads]);`;

code = code.replace(target1, replace1);

fs.writeFileSync('app/page.tsx', code);
