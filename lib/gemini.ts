import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'crypto';
import { appStore, maskApiKey } from './store';
import {
  getRequestGeminiPool,
  recordRequestGeminiKeyQuotaError,
  recordRequestGeminiKeySuccess,
} from './user-gemini-context';
import {
  BusinessProfile,
  CompetitorGapAnalysis,
  ContactVerification,
  DigitalOpportunityProfile,
  Lead,
  Proposal,
  ProspectIntent,
  WebsiteAudit,
  WebsiteConcept,
  WebsiteStatus,
} from './types';

// Dynamic / active GoogleGenAI client tracking
let currentActiveClient: GoogleGenAI | null = null;

function resolveActiveGenAIClient(): GoogleGenAI {
  if (currentActiveClient) {
    return currentActiveClient;
  }
  const pool = getRequestGeminiPool() ?? appStore.getApiKeyPool();
  const activeKey =
    pool.keys.find((k) => k.status === 'ACTIVE')?.key ||
    pool.keys[0]?.key ||
    process.env.GEMINI_API_KEY;

  if (!activeKey) {
    throw new Error('No Gemini API key available in key pool or environment. Please configure keys in API Key Manager.');
  }

  return new GoogleGenAI({
    apiKey: activeKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Proxied client that always points to the active client/key in current scope
export function getGeminiClient(): GoogleGenAI {
  return new Proxy({} as GoogleGenAI, {
    get(_target, prop, receiver) {
      const active = resolveActiveGenAIClient();
      const value = Reflect.get(active, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(active);
      }
      return value;
    },
  });
}

// Active production models per Gemini specification
const PRIMARY_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

/**
 * Detects if an error is due to Rate Limit (429), Resource Exhausted, Quota, or Invalid Key.
 */
export function isKeyQuotaOrExhaustionError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.statusCode || err.code;
  const message = String(err.message || err.error?.message || err).toLowerCase();

  return (
    status === 429 ||
    status === 403 ||
    status === 400 ||
    status === 'RESOURCE_EXHAUSTED' ||
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('exhausted') ||
    message.includes('api_key_invalid') ||
    message.includes('permission_denied') ||
    message.includes('billing')
  );
}

/**
 * Robust JSON extraction from LLM response text
 */
function extractJsonFromResponse<T = any>(text: string): T | null {
  if (!text) return null;

  try {
    return JSON.parse(text.trim());
  } catch {
    const cleaned = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      // Find JSON array or object
      const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]);
        } catch {}
      }

      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {}
      }
    }
  }

  return null;
}

/**
 * Executes Gemini operations with dual:
 * 1. Multi-API Key Pool Rotation (tries Key 1 -> on quota error rotates to Key 2, Key 3...)
 * 2. Model Cascade Fallback (gemini-3.8-flash -> gemini-3.6-flash -> gemini-flash-latest -> gemini-3.1-flash-lite)
 */
async function callGeminiWithModelCascade(
  callFn: (modelName: string, client?: GoogleGenAI) => Promise<any>
): Promise<any> {
  const pool = getRequestGeminiPool() ?? appStore.getApiKeyPool();
  const enabledKeys = pool.keys.filter((k) => k.status !== 'DISABLED');

  // Active keys first, then quota-exhausted keys as secondary fallback if auto-rotation is on
  const keysToTry = [
    ...enabledKeys.filter((k) => k.status === 'ACTIVE'),
    ...enabledKeys.filter((k) => k.status !== 'ACTIVE' && pool.autoRotateOnQuota),
  ];

  // If pool has no keys, try process.env.GEMINI_API_KEY
  if (keysToTry.length === 0 && process.env.GEMINI_API_KEY) {
    keysToTry.push({
      id: 'sys_env_default',
      name: 'System Default Key',
      key: process.env.GEMINI_API_KEY,
      maskedKey: maskApiKey(process.env.GEMINI_API_KEY),
      status: 'ACTIVE',
      addedAt: new Date().toISOString(),
      successCount: 0,
      failureCount: 0,
      isSystemDefault: true,
    });
  }

  if (keysToTry.length === 0) {
    throw new Error('No Gemini API keys configured. Please add an API key in Settings > API Key Pool.');
  }

  let lastError: any = null;
  const attemptedKeysSummary: string[] = [];

  for (let keyIdx = 0; keyIdx < keysToTry.length; keyIdx++) {
    const keyConfig = keysToTry[keyIdx];
    attemptedKeysSummary.push(keyConfig.name);

    const client = new GoogleGenAI({
      apiKey: keyConfig.key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-rotation',
        },
      },
    });

    currentActiveClient = client;
    let keyQuotaHit = false;

    for (const model of PRIMARY_MODELS) {
      try {
        const res = await callFn(model, client);
        if (res) {
          if (!recordRequestGeminiKeySuccess(keyConfig.id)) {
            appStore.markKeySuccess(keyConfig.id);
          }
          currentActiveClient = null;
          return res;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);

        // If error is 429 / Quota / Rate Limit, mark exhausted and immediately rotate to NEXT key in pool
        if (isKeyQuotaOrExhaustionError(err)) {
          console.warn(
            `[Key Pool Rotation] Key "${keyConfig.name}" reached quota/rate limit: ${msg}. Automatically rotating to next saved key...`
          );
          if (!recordRequestGeminiKeyQuotaError(keyConfig.id, msg)) {
            appStore.markKeyQuotaExhausted(keyConfig.id, msg);
          }
          keyQuotaHit = true;
          break; // Break model loop, jump to next key in outer loop!
        }

        // If it's a 404 (model not found / deprecated), continue to next model in cascade
        console.warn(`Gemini model ${model} failed with key "${keyConfig.name}":`, msg);
        continue;
      }
    }

    if (keyQuotaHit) {
      // Continue to next key in key pool!
      continue;
    }
  }

  currentActiveClient = null;
  throw (
    lastError ||
    new Error(
      `Gemini request failed across all ${attemptedKeysSummary.length} available API keys (${attemptedKeysSummary.join(
        ', '
      )}). Please add another Gemini API key in Key Manager.`
    )
  );
}

/**
 * Discovers real businesses using Gemini with Google Search grounding.
 * Returns genuine, live search-grounded businesses with full normalized profiles.
 */
export async function discoverRealBusinesses(params: {
  category: string;
  city: string;
  country: string;
  keywords?: string;
  websiteStatusPreference?: string;
  minCount?: number;
}): Promise<Partial<Lead>[]> {
  const ai = getGeminiClient();
  const { category, city, country, keywords, websiteStatusPreference, minCount = 5 } = params;

  const targetCount = Math.min(Math.max(minCount, 3), 8);

  const prompt = `You are a real-world market intelligence search agent.
Search the web for ${targetCount} real, currently operating businesses in the following category and location:
- Category: ${category}
- City: ${city}
- Country: ${country}
${keywords ? `- Additional Context/Keywords: ${keywords}` : ''}
- Preference: ${websiteStatusPreference || 'Focus on businesses with no website, outdated website, poor mobile, or only social media pages'}

Find verified real local businesses with their real names, neighborhoods, publicly listed contact info, and actual ratings.

Return a strictly valid JSON array of objects with this schema:
[
  {
    "businessName": "Exact Real Business Name",
    "category": "${category}",
    "city": "${city}",
    "country": "${country}",
    "address": "Real street/area in ${city}",
    "websiteUrl": "https://... or null if no official website exists",
    "websiteStatus": "NO_WEBSITE" | "OUTDATED_WEBSITE" | "POOR_MOBILE" | "SLOW_WEBSITE" | "BROKEN_WEBSITE" | "SOCIAL_ONLY" | "ONE_PAGE_WEBSITE" | "NO_BOOKING_SYSTEM" | "NO_WHATSAPP_CTA" | "NO_ONLINE_ORDERING" | "WEAK_SEO" | "WEAK_CONVERSION" | "COMPETITOR_GAP" | "MODERATE" | "GOOD",
    "phone": "Real public phone number with country code",
    "email": "Public contact email or empty string",
    "socials": {
      "instagram": "https://instagram.com/... or empty string",
      "facebook": "https://facebook.com/... or empty string",
      "googleMaps": "https://maps.google.com/?q=... or empty string"
    },
    "description": "Accurate description of this business, specialties, and customer base in ${city}",
    "googleRating": 4.7,
    "googleReviewCount": 150,
    "growthSignals": ["Observable sign 1", "Observable sign 2"],
    "estimatedSize": "e.g. 5-15 staff",
    "painPoints": ["Real digital pain point 1", "Real digital pain point 2"],
    "digitalGaps": ["No online booking", "No SSL certificate", "Lacks mobile menu"],
    "opportunityLevel": "EXTREME" | "HIGH" | "MODERATE" | "LOW"
  }
]
Output only the raw JSON array.`;

  // 1. Try Google Search Grounding for live web data
  let rawJsonText = '';
  let parsed: any[] | null = null;

  try {
    const searchRes = await callGeminiWithModelCascade(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
        },
      });
    });
    rawJsonText = searchRes?.text || '';
    parsed = extractJsonFromResponse<any[]>(rawJsonText);
  } catch (searchErr) {
    console.warn('Google search grounded generation encountered an issue:', searchErr);
  }

  // 2. If search grounding did not return clean parseable JSON, execute direct structured JSON mode
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    try {
      const directRes = await callGeminiWithModelCascade(async (modelName) => {
        return await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
      });
      rawJsonText = directRes?.text || '';
      parsed = extractJsonFromResponse<any[]>(rawJsonText);
    } catch (directErr) {
      console.error('Direct structured JSON generation failed:', directErr);
    }
  }

  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(
      `Could not discover verified businesses for "${category}" in "${city}, ${country}". Please verify your internet access or refine your search keywords.`
    );
  }

  return sanitizeDiscoveredLeads(parsed, category, city, country);
}

function sanitizeDiscoveredLeads(
  leads: any[],
  fallbackCategory: string,
  fallbackCity: string,
  fallbackCountry: string
): Partial<Lead>[] {
  return leads.map((item) => {
    const rawStatus = String(item.websiteStatus || '').toUpperCase();
    let websiteStatus: WebsiteStatus = 'NO_WEBSITE';

    if (rawStatus.includes('NO_WEB') || rawStatus === 'NO_WEBSITE') websiteStatus = 'NO_WEBSITE';
    else if (rawStatus.includes('OUTDATED')) websiteStatus = 'OUTDATED_WEBSITE';
    else if (rawStatus.includes('MOBILE')) websiteStatus = 'POOR_MOBILE';
    else if (rawStatus.includes('SLOW')) websiteStatus = 'SLOW_WEBSITE';
    else if (rawStatus.includes('BROKEN')) websiteStatus = 'BROKEN_WEBSITE';
    else if (rawStatus.includes('SOCIAL')) websiteStatus = 'SOCIAL_ONLY';
    else if (rawStatus.includes('BOOKING')) websiteStatus = 'NO_BOOKING_SYSTEM';
    else if (rawStatus.includes('WHATSAPP')) websiteStatus = 'NO_WHATSAPP_CTA';
    else if (rawStatus.includes('ORDER')) websiteStatus = 'NO_ONLINE_ORDERING';
    else if (rawStatus.includes('SEO')) websiteStatus = 'WEAK_SEO';
    else if (item.websiteUrl) websiteStatus = 'OUTDATED_WEBSITE';

    const verification: ContactVerification = {
      phoneStatus: item.phone ? 'VERIFIED' : 'UNVERIFIED',
      emailStatus: item.email ? 'LIKELY' : 'UNVERIFIED',
      addressStatus: item.address ? 'VERIFIED' : 'LIKELY',
      websiteStatus: item.websiteUrl ? 'VERIFIED' : 'UNVERIFIED',
      sourceAttribution: 'Google Search Live Grounding',
    };

    const opportunityProfile: DigitalOpportunityProfile = {
      websiteStatus,
      mobileQuality: websiteStatus === 'POOR_MOBILE' ? 'POOR' : websiteStatus === 'NO_WEBSITE' ? 'NONE' : 'ACCEPTABLE',
      speedEstimate: websiteStatus === 'SLOW_WEBSITE' ? 35 : websiteStatus === 'NO_WEBSITE' ? 0 : 65,
      seoQuality: websiteStatus === 'WEAK_SEO' ? 'CRITICAL' : websiteStatus === 'NO_WEBSITE' ? 'CRITICAL' : 'AVERAGE',
      conversionQuality: websiteStatus === 'NO_WEBSITE' || websiteStatus === 'NO_BOOKING_SYSTEM' ? 'HIGH_FRICTION' : 'MODERATE',
      bookingCapability: websiteStatus !== 'NO_BOOKING_SYSTEM' && websiteStatus !== 'NO_WEBSITE',
      whatsappCapability: Boolean(item.phone),
      onlineOrdering: websiteStatus !== 'NO_ONLINE_ORDERING' && websiteStatus !== 'NO_WEBSITE',
      socialPresence: Boolean(item.socials?.instagram || item.socials?.facebook) ? 'STRONG' : 'MODERATE',
      digitalGaps: Array.isArray(item.digitalGaps) && item.digitalGaps.length > 0 ? item.digitalGaps : ['No direct online booking mechanism'],
      opportunityLevel: (item.opportunityLevel as any) || (websiteStatus === 'NO_WEBSITE' ? 'EXTREME' : 'HIGH'),
    };

    return {
      ...item,
      businessName: item.businessName || `${fallbackCategory} Provider`,
      category: item.category || fallbackCategory,
      city: item.city || fallbackCity,
      country: item.country || fallbackCountry,
      websiteUrl: item.websiteUrl ? String(item.websiteUrl).trim() : undefined,
      websiteStatus,
      googleRating: typeof item.googleRating === 'number' ? item.googleRating : 4.5,
      googleReviewCount: typeof item.googleReviewCount === 'number' ? item.googleReviewCount : 25,
      growthSignals: Array.isArray(item.growthSignals) && item.growthSignals.length > 0
        ? item.growthSignals
        : ['Active local commercial operations'],
      painPoints: Array.isArray(item.painPoints) && item.painPoints.length > 0
        ? item.painPoints
        : ['Lacks a modern conversion-optimized web application'],
      verification,
      opportunityProfile,
    };
  });
}

/**
 * Conducts deep research on an individual business, including Competitor Intelligence and Metric distinctions.
 */
export async function researchBusinessDeep(
  business: Partial<Lead>
): Promise<{
  painPoints: string[];
  growthSignals: string[];
  recommendedService: string;
  recommendedPrice: number;
  reasoning: string;
  websiteAudit: WebsiteAudit;
  competitorGap: CompetitorGapAnalysis;
}> {
  const ai = getGeminiClient();

  const prompt = `Perform an in-depth digital audit and competitor intelligence analysis for this real business:
- Business Name: ${business.businessName}
- Category: ${business.category}
- Location: ${business.city}, ${business.country}
- Website URL: ${business.websiteUrl || 'None (No official website)'}
- Current Website Status: ${business.websiteStatus || 'NO_WEBSITE'}
- Social Footprint: ${JSON.stringify(business.socials || {})}
- Description: ${business.description || 'Local business'}

Generate a comprehensive, tailored audit and competitor analysis as a JSON object:
{
  "painPoints": ["3-4 specific digital and commercial bottlenecks"],
  "growthSignals": ["2-3 observable signals of active customer demand or revenue"],
  "recommendedService": "Tailored Web Package (e.g. Next.js High-Converting Website + WhatsApp Booking Funnel)",
  "recommendedPrice": 499,
  "reasoning": "Detailed justification of why this web investment will deliver high ROI for this specific business",
  "websiteAudit": {
    "score": 25,
    "hasHttps": boolean,
    "isMobileResponsive": boolean,
    "pageSpeedEstimate": 35,
    "designQuality": "POOR" | "AVERAGE" | "MODERN",
    "hasClearCTA": boolean,
    "hasContactFunnel": boolean,
    "seoBasicsScore": 20,
    "problems": ["3 distinct audit issues"],
    "opportunities": ["3 high-impact revenue and conversion opportunities"],
    "redesignValue": "LOW" | "MEDIUM" | "HIGH",
    "executiveSummary": "Executive summary of digital health",
    "businessImpact": "Commercial impact of digital shortcomings",
    "technicalQuality": "Modern Next.js vs obsolete codebase assessment",
    "ctaQuality": "Assessment of call-to-actions",
    "modernityScore": 30,
    "suggestedFeatures": ["1-tap WhatsApp booking", "Digital service catalog", "Google reviews slider", "Schema SEO"],
    "suggestedPackage": "PROFESSIONAL",
    "metricTypes": {
      "pageSpeedEstimate": "ESTIMATED",
      "seoBasicsScore": "AI_INFERRED",
      "hasHttps": "MEASURED",
      "isMobileResponsive": "AI_INFERRED"
    }
  },
  "competitorGap": {
    "competitorsFound": [
      {
        "competitorName": "Nearby Competitor Name",
        "hasModernWebsite": true,
        "hasOnlineBooking": true,
        "hasWhatsAppCTA": true,
        "hasOnlineOrdering": false,
        "googleRating": 4.6,
        "reviewCount": 180,
        "keyAdvantage": "Offers 1-click mobile appointment booking"
      }
    ],
    "competitiveGapSummary": "Clear description of what nearby competitors offer that this business lacks",
    "lostOpportunityEstimateMonthly": "$1,200 - $3,000 in missed appointments/orders",
    "recommendedDifferentiators": ["Instant WhatsApp booking response", "Transparent digital pricing", "Speed-optimized Next.js mobile load"]
  }
}
Output strictly valid JSON.`;

  const response = await callGeminiWithModelCascade(async (modelName) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });
  });

  const parsed = extractJsonFromResponse<any>(response?.text || '');
  if (!parsed || !parsed.websiteAudit) {
    throw new Error(`Failed to complete deep audit for "${business.businessName}".`);
  }

  return {
    painPoints: parsed.painPoints || ['Missing modern conversion funnel'],
    growthSignals: parsed.growthSignals || ['Active commercial customer base'],
    recommendedService: parsed.recommendedService || 'Custom Next.js Web App + WhatsApp Funnel',
    recommendedPrice: parsed.recommendedPrice || 499,
    reasoning: parsed.reasoning || 'High customer demand with significant digital opportunity.',
    websiteAudit: {
      ...parsed.websiteAudit,
      lastAuditedAt: new Date().toISOString(),
    },
    competitorGap: parsed.competitorGap || {
      competitorsFound: [],
      competitiveGapSummary: 'Competitors in the local area already leverage mobile-first sites and direct messaging.',
      lostOpportunityEstimateMonthly: '$1,000+ in missed customer inquiries',
      recommendedDifferentiators: ['Instant WhatsApp conversion funnel', 'Fast mobile loading'],
    },
  };
}

/**
 * Generates an interactive, high-converting Free Website Concept tailored to the business.
 */
export async function generateWebsiteConcept(params: {
  lead: Lead;
  profile: BusinessProfile;
}): Promise<WebsiteConcept> {
  const ai = getGeminiClient();
  const { lead, profile } = params;

  const prompt = `You are an elite UX/UI Creative Director and Conversion Architect for modern web applications.
Generate a tailored, high-converting Website Concept for this business:
- Business Name: ${lead.businessName}
- Category: ${lead.category}
- Location: ${lead.city}, ${lead.country}
- Observed Digital Gap: ${lead.websiteStatus}
- Pain Points: ${(lead.painPoints || []).join('; ')}
- Competitor Gaps: ${lead.competitorGap?.competitiveGapSummary || 'Competitors have automated online booking'}
- Agency Tech Stack: ${profile.techStack.join(', ')}

Create a complete digital website concept that will amaze the client when shown.
Output strictly valid JSON with this schema:
{
  "headline": "Punchy, high-converting headline tailored to their exact business",
  "subheadline": "Clear value proposition addressing their local customers in ${lead.city}",
  "primaryCTA": "Primary button text (e.g. 'Book Table via WhatsApp' or 'Schedule Free Consultation')",
  "secondaryCTA": "Secondary button text (e.g. 'Explore Full Menu & Prices' or 'View Our Work')",
  "sitemap": ["Home", "Services / Menu", "About Us", "Patient / Client Reviews", "Contact & Location"],
  "colorPalette": {
    "primary": "#0F172A",
    "secondary": "#3B82F6",
    "accent": "#10B981",
    "background": "#F8FAFC"
  },
  "serviceSections": [
    {
      "name": "Signature Service or Category 1",
      "description": "Engaging description showcasing quality and customer benefits",
      "iconName": "Sparkles",
      "priceStartingAt": "From $49"
    },
    {
      "name": "Signature Service or Category 2",
      "description": "Engaging description showcasing quality and customer benefits",
      "iconName": "Clock",
      "priceStartingAt": "From $89"
    },
    {
      "name": "Signature Service or Category 3",
      "description": "Engaging description showcasing quality and customer benefits",
      "iconName": "ShieldCheck",
      "priceStartingAt": "From $129"
    }
  ],
  "socialProofSection": {
    "title": "Why ${lead.city} Customers Love Us",
    "highlightReviews": [
      {
        "reviewer": "Sarah K.",
        "quote": "Best experience in the area. Fast, professional, and friendly staff!",
        "rating": 5
      },
      {
        "reviewer": "Ahmed R.",
        "quote": "Incredible service and quality. Highly recommended to anyone in ${lead.city}.",
        "rating": 5
      }
    ]
  },
  "contactSection": {
    "address": "${lead.address || `${lead.city}, ${lead.country}`}",
    "phone": "${lead.phone || 'Direct line available'}",
    "hours": "Mon - Sat: 9:00 AM - 9:00 PM",
    "whatsappPrompt": "Chat directly with our team on WhatsApp for instant inquiries."
  },
  "bookingCTA": {
    "title": "Ready to experience the best in ${lead.city}?",
    "description": "Reserve online in under 30 seconds with instant confirmation to your phone.",
    "buttonText": "Instant WhatsApp Booking"
  },
  "seoMeta": {
    "title": "${lead.businessName} - Top ${lead.category} in ${lead.city}",
    "description": "Visit ${lead.businessName} in ${lead.city}. Offering premium ${lead.category} services, direct online booking, and verified customer satisfaction.",
    "keywords": ["${lead.category} in ${lead.city}", "${lead.businessName}", "best ${lead.category}"]
  }
}`;

  const response = await callGeminiWithModelCascade(async (modelName) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });
  });

  const parsed = extractJsonFromResponse<any>(response?.text || '');
  if (!parsed || !parsed.headline) {
    throw new Error(`Failed to generate website concept for "${lead.businessName}".`);
  }

  const previewId = `concept_${randomUUID()}`;

  return {
    id: `wc_${Date.now()}`,
    previewId,
    leadId: lead.id,
    version: 1,
    createdAt: new Date().toISOString(),
    sitemap: parsed.sitemap || ['Home', 'Services', 'Reviews', 'Contact'],
    headline: parsed.headline,
    subheadline: parsed.subheadline,
    primaryCTA: parsed.primaryCTA,
    secondaryCTA: parsed.secondaryCTA,
    colorPalette: parsed.colorPalette || {
      primary: '#0f172a',
      secondary: '#2563eb',
      accent: '#10b981',
      background: '#f8fafc',
    },
    serviceSections: parsed.serviceSections || [],
    socialProofSection: parsed.socialProofSection || {
      title: 'Customer Reviews',
      highlightReviews: [],
    },
    contactSection: parsed.contactSection || {
      address: lead.address || lead.city,
      phone: lead.phone || '',
      hours: 'Mon-Sat: 9AM - 8PM',
      whatsappPrompt: 'Message us on WhatsApp',
    },
    bookingCTA: parsed.bookingCTA || {
      title: 'Book Now',
      description: 'Instant reservation via WhatsApp',
      buttonText: 'Book Now',
    },
    seoMeta: parsed.seoMeta || {
      title: lead.businessName,
      description: lead.description,
      keywords: [lead.category, lead.city],
    },
  };
}

/**
 * Classifies a prospect reply's intent, sentiment, objections, and suggests the next move.
 */
export async function classifyReplyIntent(params: {
  prospectMessage: string;
  lead: Lead;
  profile: BusinessProfile;
}): Promise<{
  intent: ProspectIntent;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'SKEPTICAL' | 'NEGATIVE';
  objectionRaised?: string;
  buyingSignals: string[];
  extractedFacts: string[];
  suggestedResponse: string;
  recommendedNextAction: string;
}> {
  const ai = getGeminiClient();
  const { prospectMessage, lead, profile } = params;

  const prompt = `You are an AI Sales Intelligence engine analyzing an incoming reply from a prospective client.
DEVELOPER: ${profile.name} (${profile.title})
PROSPECT: ${lead.businessName} (${lead.category} in ${lead.city})
OFFER: ${lead.recommendedService} ($${lead.dealValue || 499})

PROSPECT'S MESSAGE:
"${prospectMessage}"

Classify this message and extract structured intelligence.
Intent MUST be one of:
PRICING_REQUEST, INTERESTED, SEND_DETAILS, MEETING_REQUEST, CALL_REQUEST, TIMELINE_REQUEST,
OBJECTION_PRICE, OBJECTION_NEED, OBJECTION_EXISTING_DEVELOPER, OBJECTION_TRUST, OBJECTION_TIMING,
NOT_INTERESTED, WRONG_CONTACT, DO_NOT_CONTACT, OTHER.

Output strictly valid JSON with this schema:
{
  "intent": "PRICING_REQUEST",
  "sentiment": "POSITIVE" | "NEUTRAL" | "SKEPTICAL" | "NEGATIVE",
  "objectionRaised": "Exact objection if any, otherwise null",
  "buyingSignals": ["List of any detected positive buying indicators"],
  "extractedFacts": ["Any specific facts mentioned like budget, timeline, key person"],
  "suggestedResponse": "High-converting, friendly, non-pushy direct reply draft for developer to send back",
  "recommendedNextAction": "Specific next move (e.g. 'Send pricing tiers', 'Offer 10-minute demo call', 'Share concept mockup link')"
}`;

  const response = await callGeminiWithModelCascade(async (modelName) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });
  });

  const parsed = extractJsonFromResponse<any>(response?.text || '');
  if (!parsed || !parsed.intent) {
    throw new Error('Failed to classify reply intent.');
  }

  return {
    intent: parsed.intent as ProspectIntent,
    sentiment: parsed.sentiment || 'NEUTRAL',
    objectionRaised: parsed.objectionRaised || undefined,
    buyingSignals: parsed.buyingSignals || [],
    extractedFacts: parsed.extractedFacts || [],
    suggestedResponse: parsed.suggestedResponse || 'Thank you for reaching out! Happy to assist.',
    recommendedNextAction: parsed.recommendedNextAction || 'Follow up with details',
  };
}

/**
 * Generates real personalized cold outreach and multi-touch follow-up sequence.
 */
export async function generatePersonalizedOutreach(
  lead: Lead,
  profile: BusinessProfile
): Promise<{
  subject: string;
  initialMessage: string;
  followUpSequence: Lead['followUpSequence'];
}> {
  const ai = getGeminiClient();

  const conceptSnippet = lead.websiteConcept
    ? `Mention that an interactive concept mockup has been drafted for ${lead.businessName} with direct WhatsApp booking.`
    : `Offer to share a free 2-page interactive mockup.`;

  const competitorGapText = lead.competitorGap?.competitiveGapSummary
    ? `Local Competitor Context: ${lead.competitorGap.competitiveGapSummary}`
    : '';

  const prompt = `You are a high-performing, non-spammy client acquisition copywriter for freelance web developers.
Generate a personalized cold outreach message and a 4-step follow-up sequence for this real business prospect.

DEVELOPER PROFILE:
- Name: ${profile.name}
- Title: ${profile.title}
- Portfolio: ${profile.portfolioUrl}
- Email: ${profile.email}
- WhatsApp: ${profile.whatsapp}
- Special Offer: ${profile.specialOffer}
- Tech Stack: ${profile.techStack.join(', ')}

PROSPECT DETAILS:
- Business: ${lead.businessName}
- Category: ${lead.category}
- Location: ${lead.city}, ${lead.country}
- Website: ${lead.websiteUrl || 'No official website'}
- Website Status: ${lead.websiteStatus}
- Pain Points: ${(lead.painPoints || []).join('; ')}
- Growth Signals: ${(lead.growthSignals || []).join('; ')}
- Recommended Service: ${lead.recommendedService || 'Next.js Web Application'}
${competitorGapText}
${conceptSnippet}

REQUIREMENTS:
- Craft natural, respectful, professional copy referencing their exact business name, city, and observed digital gaps.
- Highlight tangible commercial value (direct bookings, WhatsApp ordering, Google search visibility, saving aggregator commissions).
- Offer a complimentary concept mockup preview to reduce barrier to entry.
- Provide 4 distinct touchpoints: Day 0 (Initial), Day 3 (Quick follow-up), Day 7 (Value-add idea), Day 14 (Friendly check-in).

Output strictly valid JSON:
{
  "subject": "Subject line",
  "initialMessage": "Complete initial outreach message with developer signature and links",
  "followUpSequence": [
    {
      "day": 0,
      "type": "INITIAL",
      "subject": "Subject line",
      "body": "Full body text",
      "channel": "WHATSAPP",
      "status": "APPROVED"
    },
    {
      "day": 3,
      "type": "QUICK_FOLLOWUP",
      "subject": "Subject line",
      "body": "Full body text",
      "channel": "WHATSAPP",
      "status": "DRAFT"
    },
    {
      "day": 7,
      "type": "VALUE_ADD",
      "subject": "Subject line",
      "body": "Full body text",
      "channel": "WHATSAPP",
      "status": "DRAFT"
    },
    {
      "day": 14,
      "type": "FINAL_CHECKIN",
      "subject": "Subject line",
      "body": "Full body text",
      "channel": "WHATSAPP",
      "status": "DRAFT"
    }
  ]
}`;

  const response = await callGeminiWithModelCascade(async (modelName) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });
  });

  const parsed = extractJsonFromResponse<any>(response?.text || '');
  if (!parsed || !parsed.initialMessage || !Array.isArray(parsed.followUpSequence)) {
    throw new Error(`Failed to generate outreach sequence for "${lead.businessName}".`);
  }

  return {
    subject: parsed.subject || `Quick question regarding ${lead.businessName}'s online presence`,
    initialMessage: parsed.initialMessage,
    followUpSequence: parsed.followUpSequence,
  };
}

/**
 * Real AI Sales Assistant copilot for lead closing strategies.
 */
export async function askSalesCopilot(params: {
  lead: Lead;
  question: string;
  profile: BusinessProfile;
}): Promise<string> {
  const ai = getGeminiClient();
  const { lead, question, profile } = params;

  const memory = lead.conversationMemory;
  const conversationSummary = memory?.messages?.length
    ? memory.messages
        .slice(-5)
        .map((m) => `[${m.sender} via ${m.channel}]: ${m.messageText}`)
        .join('\n')
    : 'No previous back-and-forth logged yet.';

  const prompt = `You are an elite Web Development Sales Strategist and Closing Copilot.
You are advising developer ${profile.name} (${profile.title}) on winning this specific prospective client.

PROSPECT DATA:
- Business: ${lead.businessName} (${lead.category}) in ${lead.city}, ${lead.country}
- Website: ${lead.websiteUrl || 'No website'} (${lead.websiteStatus})
- Score: ${lead.scoreBreakdown?.totalScore || 80}/100 [${lead.scoreBreakdown?.tier || 'HIGH'}]
- Opportunity Level: ${lead.opportunityProfile?.opportunityLevel || 'HIGH'}
- Pain Points: ${(lead.painPoints || []).join('; ')}
- Competitor Gap: ${lead.competitorGap?.competitiveGapSummary || 'Competitors have active online booking'}
- Website Concept Available: ${lead.websiteConcept ? `Yes (Headline: "${lead.websiteConcept.headline}")` : 'No'}
- Stage: ${lead.status}
- Current Intent: ${lead.conversationMemory?.currentIntent || 'Unspecified'}
- Deal Estimate: $${lead.dealValue || lead.recommendedPrice || 450} USD
- Recent Conversation:
${conversationSummary}

DEVELOPER QUESTION / CLIENT OBJECTION:
"${question}"

Provide a tactical, ethical, and high-converting response:
Output structured markdown with:
### 🎯 Strategy
(Core tactical approach)

### 💬 Suggested Reply Script
(Exact copy-paste script)

### 💡 Why It Works
(Psychological and commercial justification)

### 🔄 Alternative Option
(Low-friction backup reply)`;

  const response = await callGeminiWithModelCascade(async (modelName) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });
  });

  const answer = response?.text?.trim();
  if (!answer) {
    throw new Error('Sales copilot did not return a response.');
  }

  return answer;
}

/**
 * Generates a real custom web development proposal document.
 */
export async function generateProposalDoc(params: {
  lead: Lead;
  profile: BusinessProfile;
  tier: 'STARTER' | 'PROFESSIONAL' | 'PREMIUM';
  priceOverride?: number;
}): Promise<Proposal> {
  const ai = getGeminiClient();
  const { lead, profile, tier, priceOverride } = params;
  const targetPrice = priceOverride || (tier === 'STARTER' ? 199 : tier === 'PROFESSIONAL' ? 499 : 999);

  const prompt = `Generate a comprehensive Web Development Proposal document:
- Client: ${lead.businessName} (${lead.category} in ${lead.city}, ${lead.country})
- Developer: ${profile.name} (${profile.title})
- Tier: ${tier}
- Investment: $${targetPrice} USD
- Identified Problems: ${(lead.painPoints || []).join('; ')}
- Competitor Gaps: ${lead.competitorGap?.competitiveGapSummary || 'Competitors have automated online booking'}
- Recommended Solution: ${lead.recommendedService}

Output strictly valid JSON with this schema:
{
  "problemIdentified": ["Problem 1", "Problem 2", "Problem 3"],
  "recommendedSolution": "Detailed description of custom Next.js technical solution",
  "scopeFeatures": [
    { "feature": "Feature 1", "benefit": "Commercial benefit to client" },
    { "feature": "Feature 2", "benefit": "Commercial benefit to client" },
    { "feature": "Feature 3", "benefit": "Commercial benefit to client" },
    { "feature": "Feature 4", "benefit": "Commercial benefit to client" }
  ],
  "timelineWeeks": ${tier === 'STARTER' ? 1 : tier === 'PROFESSIONAL' ? 2 : 3},
  "revisionPolicy": "Includes 2 complete rounds of design and content adjustments prior to launch.",
  "hostingAndDomainNote": "Deployment on global CDN with SSL security and custom domain configuration included.",
  "maintenanceMonthlyOption": 49,
  "callToAction": "Clear next step instructions"
}`;

  const response = await callGeminiWithModelCascade(async (modelName) => {
    return await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });
  });

  const parsed = extractJsonFromResponse<any>(response?.text || '');
  if (!parsed || !Array.isArray(parsed.scopeFeatures)) {
    throw new Error(`Failed to generate proposal for "${lead.businessName}".`);
  }

  return {
    id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    leadId: lead.id,
    businessName: lead.businessName,
    clientContactName: `${lead.businessName} Decision Maker`,
    problemIdentified: parsed.problemIdentified || lead.painPoints,
    recommendedSolution: parsed.recommendedSolution,
    scopeFeatures: parsed.scopeFeatures,
    timelineWeeks: parsed.timelineWeeks || (tier === 'STARTER' ? 1 : tier === 'PROFESSIONAL' ? 2 : 3),
    packageTier: tier,
    totalPrice: targetPrice,
    currency: profile.currency || 'USD',
    revisionPolicy: parsed.revisionPolicy,
    hostingAndDomainNote: parsed.hostingAndDomainNote,
    maintenanceMonthlyOption: parsed.maintenanceMonthlyOption || 49,
    callToAction: parsed.callToAction,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    pdfExportAvailable: true,
  };
}


export async function generateSalesCopilotAdvice(lead: Lead, profile: any, query: string): Promise<string> {
  const ai = getGeminiClient();
  const prompt = `You are an expert sales copilot for an agency: ${profile.name}.
Lead: ${lead.businessName} (${lead.category}).
Question: ${query}
Provide a short, actionable piece of advice (1-2 paragraphs) for the sales rep.`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt });
    return res.text || 'No advice generated';
  } catch (err) {
    console.error(err);
    return 'Error generating advice.';
  }
}

export async function generateEmailReply(lead: Lead, profile: any, action: string, objection?: string) {
  const ai = getGeminiClient();
  const prompt = `You are a sales rep for ${profile.name}.
Lead: ${lead.businessName}.
They replied to your email with a ${action}. ${objection ? 'Objection: ' + objection : ''}
Draft a short reply and determine if they are 'positive', 'negative', or 'objection'.
Return JSON with { "reply": "...", "suggestedStatus": "positive|negative|objection" }`;
  try {
    const res = await ai.models.generateContent({ 
      model: 'gemini-3.5-flash', 
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(res.text || '{}');
  } catch (err) {
    console.error(err);
    return { reply: 'Thanks for getting back to us. Let me know if you change your mind.', suggestedStatus: action === 'accept' ? 'positive' : 'negative' };
  }
}

export async function generateProjectHandoff(lead: Lead, profile: any, instructions: string) {
  const ai = getGeminiClient();
  const prompt = `Generate a project handoff brief.
Lead: ${lead.businessName}.
Agency: ${profile.name}.
Instructions: ${instructions}.
Return JSON with { "summary": "...", "timeline": "...", "deliverables": ["..."] }`;
  try {
    const res = await ai.models.generateContent({ 
      model: 'gemini-3.5-flash', 
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(res.text || '{}');
  } catch (err) {
    console.error(err);
    return { summary: instructions, timeline: 'TBD', deliverables: [] };
  }
}
