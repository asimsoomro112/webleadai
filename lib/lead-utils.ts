import { Lead, WebsiteStatus, LeadTier } from './types';
import { determineNextBestAction } from './scorer';

/**
 * Normalizes any lead record (e.g. loaded from Firestore or raw API)
 * into a safe, valid Lead object with guaranteed non-null fields.
 * Prevents UI crashes from missing properties like websiteStatus, painPoints, scoreBreakdown, etc.
 */
export function normalizeLead(leadData: any): Lead {
  if (!leadData || typeof leadData !== 'object') {
    return {
      id: `lead_${Date.now()}`,
      businessName: 'Business Lead',
      category: 'General',
      city: 'Karachi',
      country: 'Pakistan',
      websiteStatus: 'NO_WEBSITE',
      socials: {},
      description: 'Discovered business opportunity',
      growthSignals: ['Active local commercial operations'],
      estimatedSize: '1-10 staff',
      scoreBreakdown: {
        totalScore: 65,
        tier: 'WARM',
        websiteOpportunityScore: 25,
        contactQualityScore: 20,
        digitalPresenceScore: 20,
        reasoning: 'Commercial business with strong digital growth potential',
      },
      painPoints: ['Lacks modern high-converting web presence'],
      recommendedService: 'Custom Web Application & Booking Integration',
      recommendedPrice: 450,
      dealValue: 450,
      status: 'NEW',
      primaryChannel: 'WHATSAPP',
      channelCompliance: 'WEB_INTENT',
      activities: [],
      notes: [],
      followUpSequence: [],
      proposals: [],
    } as unknown as Lead;
  }

  const websiteUrl = leadData.websiteUrl ? String(leadData.websiteUrl).trim() : undefined;

  // Safe websiteStatus resolution
  let websiteStatus: WebsiteStatus = 'NO_WEBSITE';
  if (leadData.websiteStatus && typeof leadData.websiteStatus === 'string') {
    const raw = leadData.websiteStatus.trim().toUpperCase();
    if (raw !== 'UNDEFINED' && raw !== 'NULL' && raw !== '') {
      websiteStatus = raw as WebsiteStatus;
    } else {
      websiteStatus = websiteUrl ? 'OUTDATED_WEBSITE' : 'NO_WEBSITE';
    }
  } else if (websiteUrl) {
    websiteStatus = 'OUTDATED_WEBSITE';
  }

  const painPoints = Array.isArray(leadData.painPoints) && leadData.painPoints.length > 0
    ? leadData.painPoints.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
    : [typeof leadData.painPoints === 'string' && leadData.painPoints ? leadData.painPoints : 'Missing modern responsive web application'];

  const growthSignals = Array.isArray(leadData.growthSignals) && leadData.growthSignals.length > 0
    ? leadData.growthSignals.filter((g: any) => typeof g === 'string' && g.trim().length > 0)
    : ['Active local commercial operations'];

  const totalScore = typeof leadData.scoreBreakdown?.totalScore === 'number'
    ? leadData.scoreBreakdown.totalScore
    : 65;

  const tier: LeadTier = leadData.scoreBreakdown?.tier || (totalScore >= 80 ? 'HOT' : totalScore >= 50 ? 'WARM' : 'COLD');

  const scoreBreakdown = {
    totalScore,
    tier,
    websiteOpportunityScore: typeof leadData.scoreBreakdown?.websiteOpportunityScore === 'number' ? leadData.scoreBreakdown.websiteOpportunityScore : 25,
    contactQualityScore: typeof leadData.scoreBreakdown?.contactQualityScore === 'number' ? leadData.scoreBreakdown.contactQualityScore : 20,
    digitalPresenceScore: typeof leadData.scoreBreakdown?.digitalPresenceScore === 'number' ? leadData.scoreBreakdown.digitalPresenceScore : 20,
    reasoning: leadData.scoreBreakdown?.reasoning || 'Active commercial business with high conversion opportunity',
  };

  const businessName = leadData.businessName || 'Business Prospect';
  const category = leadData.category || 'General';
  const city = leadData.city || 'Karachi';
  const country = leadData.country || 'Pakistan';

  const normalized: Lead = {
    ...leadData,
    id: leadData.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    businessName,
    category,
    city,
    country,
    websiteUrl,
    websiteStatus,
    phone: leadData.phone || undefined,
    email: leadData.email || undefined,
    socials: leadData.socials && typeof leadData.socials === 'object' ? leadData.socials : {},
    description: leadData.description || `${category} provider in ${city}`,
    googleRating: typeof leadData.googleRating === 'number' ? leadData.googleRating : 4.5,
    googleReviewCount: typeof leadData.googleReviewCount === 'number' ? leadData.googleReviewCount : 25,
    growthSignals: growthSignals.length > 0 ? growthSignals : ['Active local commercial operations'],
    estimatedSize: leadData.estimatedSize || '1-10 staff',
    painPoints: painPoints.length > 0 ? painPoints : ['Missing modern responsive web application'],
    scoreBreakdown,
    recommendedService: leadData.recommendedService || 'Custom Next.js Web App + WhatsApp Booking',
    recommendedPrice: typeof leadData.recommendedPrice === 'number' ? leadData.recommendedPrice : 450,
    dealValue: typeof leadData.dealValue === 'number' ? leadData.dealValue : (typeof leadData.recommendedPrice === 'number' ? leadData.recommendedPrice : 450),
    status: leadData.status || 'NEW',
    primaryChannel: leadData.primaryChannel || 'WHATSAPP',
    channelCompliance: leadData.channelCompliance || 'WEB_INTENT',
    activities: Array.isArray(leadData.activities) ? leadData.activities : [],
    notes: Array.isArray(leadData.notes) ? leadData.notes : [],
    followUpSequence: Array.isArray(leadData.followUpSequence) ? leadData.followUpSequence : [],
    proposals: Array.isArray(leadData.proposals) ? leadData.proposals : [],
  };

  // Next Best Action guaranteed
  if (!normalized.nextBestAction || !normalized.nextBestAction.action) {
    try {
      normalized.nextBestAction = determineNextBestAction(normalized);
    } catch {
      normalized.nextBestAction = {
        action: 'SEND_INITIAL_OUTREACH',
        reason: 'New qualified opportunity ready for personalized pitch',
        reasoning: 'New qualified opportunity ready for personalized pitch',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        urgency: 'HIGH',
        priority: 'HIGH',
      };
    }
  } else {
    if (!normalized.nextBestAction.priority && normalized.nextBestAction.urgency) {
      normalized.nextBestAction.priority = normalized.nextBestAction.urgency;
    }
    if (!normalized.nextBestAction.reasoning && normalized.nextBestAction.reason) {
      normalized.nextBestAction.reasoning = normalized.nextBestAction.reason;
    }
  }

  return normalized;
}
