sed -i 's/body: JSON.stringify({ leadId: lead.id }),/body: JSON.stringify({ lead, settings }),/' app/page.tsx
sed -i 's/body: JSON.stringify({ leadId, channel, messageText: message, stepIndex }),/body: JSON.stringify({ lead: leads.find((l) => l.id === leadId), settings, analytics, channel, messageText: message, stepIndex }),/' app/page.tsx
sed -i 's/body: JSON.stringify({ leadId: lead.id, tier, priceOverride }),/body: JSON.stringify({ lead, settings, tier, priceOverride }),/' app/page.tsx
