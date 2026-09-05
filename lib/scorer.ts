import {
  DetailedScoringFactors,
  Lead,
  LeadIntent,
  LeadScoreBreakdown,
  LeadTier,
  NextBestAction,
  ScoringWeights,
  WebsiteStatus,
} from './types';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  noWebsite: 25,
  outdatedWebsite: 20,
  poorMobile: 15,
  activeSocialPresence: 10,
  growingBusiness: 10,
  weakConversionFunnel: 10,
  strongLocalDemand: 10,
};

// High-ticket categories with strong willingness to pay for high-converting sites
const HIGH_TICKET_CATEGORIES = [
  'dental',
  'clinic',
  'medical',
  'orthopedic',
  'law',
  'legal',
  'real estate',
  'cosmetic',
  'luxury',
  'fine dining',
  'b2b',
  'architect',
  'contractor',
];

const MEDIUM_TICKET_CATEGORIES = [
  'restaurant',
  'cafe',
  'bistro',
  'gym',
  'fitness',
  'salon',
  'spa',
  'auto',
  'boutique',
  'coffee',
  'bakery',
];

export function calculateLeadScore(
  lead: Partial<Lead>,
  _weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): LeadScoreBreakdown {
  const factors: LeadScoreBreakdown['factors'] = [];

  // --- 1. DIGITAL NEED (Max: 25 points) ---
  let digitalNeedScore = 0;
  const status: WebsiteStatus = lead.websiteStatus || 'NO_WEBSITE';

  if (status === 'NO_WEBSITE' || status === 'SOCIAL_ONLY') {
    digitalNeedScore = 25;
    factors.push({
      name: 'Critical Digital Gap (No Website / Social Only)',
      points: 25,
      description: 'Lacks official standalone domain; completely dependent on third parties with zero conversion funnel.',
    });
  } else if (status === 'BROKEN' || status === 'BROKEN_WEBSITE') {
    digitalNeedScore = 23;
    factors.push({
      name: 'Broken or Inaccessible Website',
      points: 23,
      description: 'Site returns errors, security warnings (SSL missing), or non-functional navigation.',
    });
  } else if (status === 'OUTDATED' || status === 'OUTDATED_WEBSITE') {
    digitalNeedScore = 20;
    factors.push({
      name: 'Outdated Legacy Architecture',
      points: 20,
      description: 'Built years ago with obsolete styling, no modern trust cues, and poor mobile readability.',
    });
  } else if (status === 'POOR_MOBILE' || status === 'SLOW_WEBSITE') {
    digitalNeedScore = 18;
    factors.push({
      name: 'Substandard Mobile UX / Slow Load Speed',
      points: 18,
      description: 'Fails smartphone responsiveness or core performance, losing 50%+ of mobile searchers.',
    });
  } else if (
    status === 'NO_BOOKING_SYSTEM' ||
    status === 'NO_ONLINE_ORDERING' ||
    status === 'NO_WHATSAPP_CTA'
  ) {
    digitalNeedScore = 16;
    factors.push({
      name: 'Missing Automated Transaction Funnel',
      points: 16,
      description: 'Site exists but lacks direct WhatsApp trigger, calendar booking, or digital catalog.',
    });
  } else if (status === 'WEAK_SEO' || status === 'WEAK_CONVERSION' || status === 'ONE_PAGE_WEBSITE') {
    digitalNeedScore = 14;
    factors.push({
      name: 'Weak Conversion & Local Discoverability',
      points: 14,
      description: 'Limited search visibility and high-friction contact forms that depress inbound inquiries.',
    });
  } else if (status === 'MODERATE') {
    digitalNeedScore = 8;
    factors.push({
      name: 'Standard Website with Enhancement Potential',
      points: 8,
      description: 'Functional basic presence; open to performance redesign and advanced automations.',
    });
  } else {
    digitalNeedScore = 3;
    factors.push({
      name: 'Mature Digital Asset',
      points: 3,
      description: 'Existing website is modern, leaving marginal scope for basic overhaul.',
    });
  }

  // --- 2. BUSINESS QUALITY & REPUTATION (Max: 20 points) ---
  let businessQualityScore = 0;
  const rating = lead.googleRating || 0;
  const reviewCount = lead.googleReviewCount || 0;

  if (rating >= 4.7 && reviewCount >= 100) {
    businessQualityScore = 20;
    factors.push({
      name: 'Market Leader Social Proof',
      points: 20,
      description: `Elite reputation: ${rating.toFixed(1)}★ across ${reviewCount}+ verified reviews proves massive customer volume.`,
    });
  } else if (rating >= 4.4 && reviewCount >= 30) {
    businessQualityScore = 17;
    factors.push({
      name: 'Strong Local Consumer Validation',
      points: 17,
      description: `Consistently favored (${rating.toFixed(1)}★ with ${reviewCount} reviews); reliable client base.`,
    });
  } else if (rating >= 4.0 && reviewCount >= 10) {
    businessQualityScore = 13;
    factors.push({
      name: 'Established Operational Track Record',
      points: 13,
      description: `Solid commercial activity (${rating.toFixed(1)}★) with active patronage.`,
    });
  } else if (rating > 0) {
    businessQualityScore = 8;
    factors.push({
      name: 'Emerging Local Establishment',
      points: 8,
      description: `Early positive reviews (${rating.toFixed(1)}★) ready for rapid acceleration.`,
    });
  } else {
    businessQualityScore = 5;
    factors.push({
      name: 'Unrated / Local Contender',
      points: 5,
      description: 'Active entity awaiting digitized customer review collection funnels.',
    });
  }

  // --- 3. REVENUE POTENTIAL & TICKET SIZE (Max: 15 points) ---
  let revenuePotentialScore = 0;
  const catLower = (lead.category || '').toLowerCase();
  const descLower = (lead.description || '').toLowerCase();

  const isHighTicket = HIGH_TICKET_CATEGORIES.some(
    (c) => catLower.includes(c) || descLower.includes(c)
  );
  const isMediumTicket = MEDIUM_TICKET_CATEGORIES.some(
    (c) => catLower.includes(c) || descLower.includes(c)
  );

  if (isHighTicket) {
    revenuePotentialScore = 15;
    factors.push({
      name: 'High-Value Client Category',
      points: 15,
      description: `Industry (${lead.category}) enjoys high customer lifetime value ($500-$5,000+ per deal), making website ROI instantaneous.`,
    });
  } else if (isMediumTicket) {
    revenuePotentialScore = 12;
    factors.push({
      name: 'High-Velocity Commercial Category',
      points: 12,
      description: `High daily transaction volume (${lead.category}); direct online orders yield immediate cash flow.`,
    });
  } else {
    revenuePotentialScore = 9;
    factors.push({
      name: 'General Commercial Potential',
      points: 9,
      description: 'Standard local business category with clear expansion upside.',
    });
  }

  // --- 4. CONTACTABILITY & DIRECT REACH (Max: 15 points) ---
  let contactabilityScore = 0;
  const hasPhone = Boolean(lead.phone);
  const hasEmail = Boolean(lead.email);
  const hasWhatsApp = Boolean(lead.socials?.instagram || lead.phone);

  if (hasPhone && hasEmail && hasWhatsApp) {
    contactabilityScore = 15;
    factors.push({
      name: 'Omni-Channel Contactability',
      points: 15,
      description: 'Verified Direct Phone, WhatsApp availability, and Email permit instant outreach.',
    });
  } else if (hasPhone && hasWhatsApp) {
    contactabilityScore = 13;
    factors.push({
      name: 'High-Intent Direct Messaging Ready',
      points: 13,
      description: 'Direct mobile phone and WhatsApp connectivity enable high-reply 1-tap pitches.',
    });
  } else if (hasPhone || hasEmail) {
    contactabilityScore = 10;
    factors.push({
      name: 'Verified Primary Contact Point',
      points: 10,
      description: 'Accessible direct communication channel available.',
    });
  } else {
    contactabilityScore = 5;
    factors.push({
      name: 'Social DM Outreach Only',
      points: 5,
      description: 'Requires reaching out through public social handles.',
    });
  }

  // --- 5. BUYING SIGNALS & GROWTH MOMENTUM (Max: 15 points) ---
  let buyingSignalsScore = 0;
  const growthSignalsCount = lead.growthSignals?.length || 0;
  const hasSocials = Boolean(
    lead.socials?.instagram || lead.socials?.facebook || lead.socials?.linkedin
  );

  let buyingSignalPts = 0;
  if (hasSocials) buyingSignalPts += 6;
  if (growthSignalsCount >= 2) buyingSignalPts += 6;
  else if (growthSignalsCount === 1) buyingSignalPts += 3;
  if (lead.opportunityProfile?.conversionQuality === 'HIGH_FRICTION' || status === 'NO_WEBSITE') {
    buyingSignalPts += 3;
  }
  buyingSignalsScore = Math.min(buyingSignalPts, 15);

  factors.push({
    name: 'Active Growth & Marketing Signals',
    points: buyingSignalsScore,
    description: `Demonstrates active commercial momentum (${growthSignalsCount} growth indicators, active marketing channels, and customer acquisition intent).`,
  });

  // --- 6. COMPETITIVE GAP (Max: 10 points) ---
  let competitiveGapScore = 0;
  const hasCompetitorGaps =
    Boolean(lead.competitorGap?.competitiveGapSummary) ||
    status === 'NO_WEBSITE' ||
    status === 'OUTDATED';

  if (hasCompetitorGaps) {
    competitiveGapScore = 10;
    factors.push({
      name: 'Severe Competitive Disadvantage',
      points: 10,
      description:
        'Local competitors already offer online booking, mobile menus, and automated WhatsApp funnels, siphoning customers away.',
    });
  } else {
    competitiveGapScore = 6;
    factors.push({
      name: 'Standard Market Competition',
      points: 6,
      description: 'Normal competitive density where a modern redesign establishes clear differentiation.',
    });
  }

  // Calculate Total Score (exact 0-100 sum)
  const totalScore = Math.min(
    Math.max(
      digitalNeedScore +
        businessQualityScore +
        revenuePotentialScore +
        contactabilityScore +
        buyingSignalsScore +
        competitiveGapScore,
      0
    ),
    100
  );

  const scoreFactors: DetailedScoringFactors = {
    digitalNeedScore,
    businessQualityScore,
    revenuePotentialScore,
    contactabilityScore,
    buyingSignalsScore,
    competitiveGapScore,
  };

  // Tier classification: HOT (80+), WARM (60-79), COLD (<60)
  let tier: LeadTier = 'COLD';
  if (totalScore >= 80) {
    tier = 'HOT';
  } else if (totalScore >= 60) {
    tier = 'WARM';
  } else {
    tier = 'COLD';
  }

  // Intent calculation
  let intent: LeadIntent = 'LOW_INTENT';
  if (totalScore >= 78 && (hasSocials || growthSignalsCount > 0)) {
    intent = 'HIGH_INTENT';
  } else if (totalScore >= 55) {
    intent = 'MEDIUM_INTENT';
  } else {
    intent = 'LOW_INTENT';
  }

  // Human-readable reasoning explaining WHY the lead received its score
  const reasoning = `Score ${totalScore}/100 because the business has ${rating > 0 ? `${rating.toFixed(1)}★ with ${reviewCount} reviews` : 'active local operations'}, ${status === 'NO_WEBSITE' ? 'no dedicated website' : `a ${status.toLowerCase().replace(/_/g, ' ')} digital asset`}, active social presence, high-value ${lead.category || 'services'}, and strong local competitors with modern booking systems.`;

  return {
    totalScore,
    tier,
    intent,
    scoreFactors,
    factors,
    reasoning,
  };
}

/**
 * Calculates Next Best Action with reasoned justification and priority due dates
 */
export function determineNextBestAction(lead: Partial<Lead>): NextBestAction {
  const status = lead.status || 'DISCOVERED';
  const score = lead.scoreBreakdown?.totalScore || 50;
  const memory = lead.conversationMemory;
  const lastIntent = memory?.currentIntent;

  // 1. If prospect requested pricing or info
  if (lastIntent === 'PRICING_REQUEST') {
    return {
      action: 'ANSWER_PRICING',
      reason: 'Prospect specifically asked for pricing/packages. Send transparent tiered scope options.',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours
      suggestedScript: `Hi ${lead.businessName} team! Our packages range from Starter ($199) to Business Growth ($499), including mobile design, hosting setup, and WhatsApp booking. Happy to send a full breakdown!`,
      urgency: 'HIGH',
    };
  }

  // 2. If prospect has an objection
  if (
    lastIntent === 'OBJECTION_PRICE' ||
    lastIntent === 'OBJECTION_EXISTING_DEVELOPER' ||
    lastIntent === 'OBJECTION_NEED'
  ) {
    return {
      action: 'HANDLE_OBJECTION',
      reason: `Prospect raised an objection (${lastIntent}). Use AI Sales Copilot counter-pitch.`,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      suggestedScript: 'Acknowledge their concern first, re-frame ROI around lost bookings, and offer the free interactive concept.',
      urgency: 'HIGH',
    };
  }

  // 3. If prospect is interested or requested call
  if (
    lastIntent === 'MEETING_REQUEST' ||
    lastIntent === 'CALL_REQUEST' ||
    status === 'MEETING_REQUESTED' ||
    status === 'CALL_BOOKED'
  ) {
    return {
      action: 'REQUEST_CALL',
      reason: 'Prospect expressed positive interest in speaking. Lock in a quick 10-minute strategy call.',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
      suggestedScript: 'Send a 2-slot scheduling option: "Would today at 4 PM or tomorrow at 11 AM work for a quick 10-min screen share?"',
      urgency: 'HIGH',
    };
  }

  // 4. If in negotiation or proposal sent
  if (status === 'PROPOSAL_SENT' || status === 'NEGOTIATION') {
    return {
      action: 'FOLLOW_UP_PROPOSAL',
      reason: 'Proposal was sent. Follow up on specific questions and offer contract onboarding.',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      suggestedScript: 'Check in on scope alignment: "Did you have any questions on the delivery timeline or WhatsApp integration?"',
      urgency: 'MEDIUM',
    };
  }

  // 5. If won but not yet onboarded
  if (status === 'WON' || status === 'CONTRACT_SENT') {
    return {
      action: 'INITIATE_ONBOARDING',
      reason: 'Deal closed! Send deposit link, kick-off questionnaire, and lock in launch date.',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
      suggestedScript: 'Send onboarding welcoming message with scope deliverables and timeline.',
      urgency: 'HIGH',
    };
  }

  // 6. If contacted with no reply yet
  if (status === 'CONTACTED') {
    return {
      action: 'SEND_FOLLOWUP',
      reason: 'Initial outreach sent. Prepare Day 3 value-add or interactive demo preview reminder.',
      dueDate: lead.nextFollowUpAt || new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      suggestedScript: 'Send a polite, low-friction check-in with screenshot/link of their live concept mockup.',
      urgency: 'MEDIUM',
    };
  }

  // 7. If qualified or researched, check if concept exists
  if (!lead.websiteConcept && score >= 70) {
    return {
      action: 'SEND_WEBSITE_CONCEPT',
      reason: 'High-opportunity lead with no website concept generated yet. Generate free mockup to maximize response rate.',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
      urgency: 'HIGH',
    };
  }

  // 8. Default for new/discovered leads
  return {
    action: 'SEND_INITIAL_OUTREACH',
    reason: 'Lead qualified with clear digital gap. Dispatch tailored outreach pitching instant value.',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    urgency: score >= 80 ? 'HIGH' : 'MEDIUM',
  };
}

