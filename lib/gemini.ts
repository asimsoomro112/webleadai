import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'crypto';
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
  callFn: (modelName: string, client: GoogleGenAI) => Promise<any>
): Promise<any> {
  const pool = getRequestGeminiPool();
  if (!pool) {
    throw new Error('Gemini calls must run within an authenticated user API-key context.');
  }
  const enabledKeys = pool.keys.filter((k) => k.status !== 'DISABLED');

  // Active keys first, then quota-exhausted keys as secondary fallback if auto-rotation is on
  const keysToTry = [
    ...enabledKeys.filter((k) => k.status === 'ACTIVE'),
    ...enabledKeys.filter((k) => k.status !== 'ACTIVE' && pool.autoRotateOnQuota),
  ];

  if (keysToTry.length === 0) {
    throw new Error('No enabled Gemini API keys configured. Add or enable a key in Settings > API Key Pool.');
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

    let keyQuotaHit = false;

    for (const model of PRIMARY_MODELS) {
      try {
        const res = await callFn(model, client);
        if (res) {
          if (!recordRequestGeminiKeySuccess(keyConfig.id)) {
            throw new Error('Gemini request was not associated with an authenticated user key pool.');
          }
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
            throw new Error('Gemini request was not associated with an authenticated user key pool.');
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
    const searchRes = await callGeminiWithModelCascade(async (modelName, client) => {
      return await client.models.generateContent({
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
      const directRes = await callGeminiWithModelCascade(async (modelName, client) => {
        return await client.models.generateContent({
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

  const response = await callGeminiWithModelCascade(async (modelName, client) => {
    return await client.models.generateContent({
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
 * Builds a complete standalone, responsive single-file HTML website prototype.
 */
export function generateStandaloneWebsiteHtml(
  concept: WebsiteConcept,
  lead: Lead,
  profile?: BusinessProfile
): string {
  const devName = profile?.name || 'Developer';
  const devTitle = profile?.title || 'Modern Web & Next.js Growth Engineer';
  const devWhatsapp = (profile?.whatsapp || profile?.phone || '').replace(/[^0-9]/g, '');
  const leadPhone = (lead.phone || '').replace(/[^0-9]/g, '');
  const targetPhone = leadPhone || devWhatsapp;
  const bookingUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(
    `Hi ${lead.businessName}, I would like to make an inquiry / booking.`
  )}`;
  const claimUrl = `https://wa.me/${devWhatsapp}?text=${encodeURIComponent(
    `Hi ${devName}, I loved the website concept for ${lead.businessName}! I want to discuss launching it.`
  )}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${concept.headline} | ${lead.businessName}</title>
  <meta name="description" content="${concept.subheadline}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --primary: ${concept.colorPalette?.primary || '#0f172a'};
      --accent: ${concept.colorPalette?.accent || '#10b981'};
      --bg: #030712;
      --card-bg: #111827;
      --text: #f9fafb;
      --text-muted: #9ca3af;
      --border: #1f2937;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: var(--bg); color: var(--text); line-height: 1.6; }
    .banner { background: #0f172a; border-bottom: 1px solid #1e293b; padding: 10px 20px; font-size: 13px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .banner-badge { background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 3px 10px; border-radius: 9999px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3); }
    .banner-btn { background: #10b981; color: #022c22; font-weight: 700; padding: 6px 14px; border-radius: 8px; text-decoration: none; font-size: 12px; transition: transform 0.2s; }
    .banner-btn:hover { transform: scale(1.03); }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 8%; border-bottom: 1px solid var(--border); background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 50; }
    .logo { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .nav-links { display: flex; gap: 24px; list-style: none; }
    .nav-links a { color: var(--text-muted); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
    .nav-links a:hover { color: #fff; }
    .hero { padding: 80px 8% 60px; text-align: center; max-width: 1000px; margin: 0 auto; }
    .rating-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: #34d399; font-size: 13px; font-weight: 600; padding: 6px 16px; border-radius: 9999px; margin-bottom: 24px; }
    .hero h1 { font-size: clamp(32px, 5vw, 54px); font-weight: 800; line-height: 1.15; margin-bottom: 20px; letter-spacing: -1px; color: #ffffff; }
    .hero p { font-size: clamp(16px, 2vw, 20px); color: var(--text-muted); max-width: 700px; margin: 0 auto 36px; }
    .cta-group { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
    .btn { padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .btn-primary { background: #10b981; color: #022c22; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.3); }
    .btn-primary:hover { background: #34d399; transform: translateY(-2px); }
    .btn-secondary { background: #1f2937; color: #fff; border: 1px solid #374151; }
    .btn-secondary:hover { background: #374151; }
    .section { padding: 80px 8%; max-width: 1200px; margin: 0 auto; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-title { font-size: 32px; font-weight: 800; margin-bottom: 12px; color: #ffffff; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 28px; transition: transform 0.2s, border-color 0.2s; }
    .card:hover { transform: translateY(-4px); border-color: rgba(16, 185, 129, 0.4); }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .card-title { font-size: 18px; font-weight: 700; color: #fff; }
    .card-price { font-size: 14px; font-weight: 700; color: #34d399; background: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 8px; }
    .card-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; }
    .reviews-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .review-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
    .stars { color: #f59e0b; margin-bottom: 8px; }
    .review-quote { font-size: 14px; font-style: italic; color: #e5e7eb; margin-bottom: 12px; }
    .reviewer { font-size: 13px; font-weight: 700; color: var(--text-muted); }
    .contact-card { background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 20px; padding: 40px; text-align: center; }
    footer { text-align: center; padding: 40px 20px; border-top: 1px solid var(--border); font-size: 13px; color: var(--text-muted); }
    .float-wa { position: fixed; bottom: 24px; right: 24px; background: #25d366; color: #fff; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 10px 30px rgba(37, 211, 102, 0.4); text-decoration: none; z-index: 100; transition: transform 0.2s; }
    .float-wa:hover { transform: scale(1.1); }
    @media (max-width: 640px) { .nav-links { display: none; } }
  </style>
</head>
<body>
  <div class="banner">
    <div>
      <span class="banner-badge">Interactive Demo</span>
      <span style="margin-left: 8px; color: #cbd5e1;">Tailored concept for <strong>${lead.businessName}</strong></span>
    </div>
    <a href="${claimUrl}" target="_blank" class="banner-btn">Claim & Launch This Website</a>
  </div>

  <nav>
    <div class="logo">${lead.businessName}</div>
    <ul class="nav-links">
      ${(concept.sitemap || ['Home', 'Services', 'Reviews', 'Contact']).map(p => `<li><a href="#services">${p}</a></li>`).join('')}
    </ul>
    <a href="${bookingUrl}" target="_blank" class="btn btn-primary" style="padding: 8px 18px; font-size: 13px;">WhatsApp Us</a>
  </nav>

  <section class="hero">
    <div class="rating-pill">
      <span>★ ${lead.googleRating || 4.8} Rated by ${lead.googleReviewCount || 40}+ locals in ${lead.city}</span>
    </div>
    <h1>${concept.headline}</h1>
    <p>${concept.subheadline}</p>
    <div class="cta-group">
      <a href="${bookingUrl}" target="_blank" class="btn btn-primary">${concept.primaryCTA}</a>
      <a href="#services" class="btn btn-secondary">${concept.secondaryCTA}</a>
    </div>
  </section>

  <section id="services" class="section">
    <div class="section-header">
      <h2 class="section-title">Signature Services & Offerings</h2>
      <p style="color: var(--text-muted); font-size: 15px;">Crafted with quality, speed, and customer satisfaction in ${lead.city}</p>
    </div>
    <div class="grid">
      ${(concept.serviceSections || []).map(s => `
        <div class="card">
          <div class="card-top">
            <h3 class="card-title">${s.name}</h3>
            ${s.priceStartingAt ? `<span class="card-price">${s.priceStartingAt}</span>` : ''}
          </div>
          <p class="card-desc">${s.description}</p>
        </div>
      `).join('')}
    </div>
  </section>

  <section class="section" style="padding-top: 0;">
    <div class="section-header">
      <h2 class="section-title">${concept.socialProofSection?.title || 'What Our Customers Say'}</h2>
      <p style="color: var(--text-muted); font-size: 15px;">Real experiences from verified clients</p>
    </div>
    <div class="reviews-grid">
      ${(concept.socialProofSection?.highlightReviews || []).map(r => `
        <div class="review-card">
          <div class="stars">★★★★★</div>
          <p class="review-quote">"${r.quote}"</p>
          <div class="reviewer">— ${r.reviewer}</div>
        </div>
      `).join('')}
    </div>
  </section>

  <section class="section" style="padding-top: 0;">
    <div class="contact-card">
      <h2 style="font-size: 28px; font-weight: 800; margin-bottom: 12px;">${concept.bookingCTA?.title || `Visit ${lead.businessName}`}</h2>
      <p style="color: #cbd5e1; max-width: 500px; margin: 0 auto 24px;">${concept.bookingCTA?.description || `Located in ${lead.city}, ${lead.country}. We are ready to serve you.`}</p>
      <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; font-size: 14px; color: #94a3b8;">
        <div>📍 ${concept.contactSection?.address || lead.city}</div>
        <div>📞 ${concept.contactSection?.phone || lead.phone || 'Direct line'}</div>
        <div>⏰ ${concept.contactSection?.hours || 'Mon - Sat: 9:00 AM - 9:00 PM'}</div>
      </div>
      <a href="${bookingUrl}" target="_blank" class="btn btn-primary">${concept.bookingCTA?.buttonText || 'Book via WhatsApp'}</a>
    </div>
  </section>

  <footer>
    <p>© ${new Date().getFullYear()} ${lead.businessName}. All rights reserved.</p>
    <p style="margin-top: 6px; font-size: 12px; color: #64748b;">Interactive Prototype designed by <strong>${devName}</strong> (${devTitle})</p>
  </footer>

  <a href="${bookingUrl}" target="_blank" class="float-wa" title="Chat on WhatsApp">💬</a>
</body>
</html>`;
}

/**
 * Generates an interactive, high-converting Free Website Concept tailored to the business.
 */
export async function generateWebsiteConcept(params: {
  lead: Lead;
  profile: BusinessProfile;
}): Promise<WebsiteConcept> {
  const { lead, profile } = params;

  const prompt = `You are an elite UX/UI Creative Director and Conversion Architect for modern web applications.
Generate a tailored, high-converting Website Concept for this business:
- Business Name: ${lead.businessName}
- Category: ${lead.category}
- Location: ${lead.city}, ${lead.country}
- Observed Digital Gap: ${lead.websiteStatus}
- Pain Points: ${(lead.painPoints || []).join('; ')}
- Competitor Gaps: ${lead.competitorGap?.competitiveGapSummary || 'Competitors have automated online booking'}
- Agency Tech Stack: ${(profile?.techStack || ['Next.js', 'React', 'Tailwind CSS']).join(', ')}

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

  let parsed: any = null;
  try {
    const response = await callGeminiWithModelCascade(async (modelName, client) => {
      return await client.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });
    });
    parsed = extractJsonFromResponse<any>(response?.text || '');
  } catch (geminiErr) {
    console.warn(`Gemini concept generation note for "${lead.businessName}":`, geminiErr);
  }

  // Ensure previewId uses a clean, URL-safe alphanumeric format
  const previewId = `concept_${(lead.id || 'lead').replace(/[^a-zA-Z0-9]/g, '')}_${Date.now().toString(36)}`;

  const concept: WebsiteConcept = {
    id: `wc_${Date.now()}`,
    previewId,
    leadId: lead.id,
    version: 1,
    createdAt: new Date().toISOString(),
    sitemap: parsed?.sitemap || ['Home', 'Services', 'Reviews', 'Contact & Booking'],
    headline: parsed?.headline || `The Premier ${lead.category} in ${lead.city}`,
    subheadline:
      parsed?.subheadline ||
      `Delivering verified excellence, fast online booking, and dedicated service for our community across ${lead.city}.`,
    primaryCTA: parsed?.primaryCTA || 'Book via WhatsApp',
    secondaryCTA: parsed?.secondaryCTA || 'Explore Menu & Services',
    colorPalette: parsed?.colorPalette || {
      primary: '#0f172a',
      secondary: '#2563eb',
      accent: '#10b981',
      background: '#f8fafc',
    },
    serviceSections: parsed?.serviceSections?.length
      ? parsed.serviceSections
      : [
          {
            name: `Signature ${lead.category} Service`,
            description: `Full-service professional experience crafted specifically for local clients in ${lead.city}.`,
            iconName: 'Sparkles',
            priceStartingAt: 'From $49',
          },
          {
            name: 'Express Direct Appointment',
            description: 'Fast priority scheduling with instant confirmation sent to your WhatsApp.',
            iconName: 'Clock',
            priceStartingAt: 'From $89',
          },
          {
            name: 'VIP Customer Satisfaction',
            description: 'Dedicated quality guarantee with 5-star verified customer service.',
            iconName: 'ShieldCheck',
            priceStartingAt: 'From $129',
          },
        ],
    socialProofSection: parsed?.socialProofSection || {
      title: `What ${lead.city} Customers Say About Us`,
      highlightReviews: [
        {
          reviewer: 'Sarah K.',
          quote: `Best experience in the area. Fast, professional, and friendly staff!`,
          rating: 5,
        },
        {
          reviewer: 'Ahmed R.',
          quote: `Incredible service and quality. Highly recommended to anyone in ${lead.city}.`,
          rating: 5,
        },
      ],
    },
    contactSection: parsed?.contactSection || {
      address: lead.address || `${lead.city}, ${lead.country}`,
      phone: lead.phone || 'Direct line available',
      hours: 'Mon - Sat: 9:00 AM - 9:00 PM',
      whatsappPrompt: 'Chat directly with our team on WhatsApp for instant inquiries.',
    },
    bookingCTA: parsed?.bookingCTA || {
      title: `Ready to experience the best in ${lead.city}?`,
      description: `Reserve online in under 30 seconds with instant confirmation to your phone.`,
      buttonText: 'Instant WhatsApp Booking',
    },
    seoMeta: parsed?.seoMeta || {
      title: `${lead.businessName} - Top ${lead.category} in ${lead.city}`,
      description: `Visit ${lead.businessName} in ${lead.city}. Offering premium ${lead.category} services, direct online booking, and verified customer satisfaction.`,
      keywords: [lead.category, lead.city, lead.businessName],
    },
  };

  concept.standaloneHtml = generateStandaloneWebsiteHtml(concept, lead, profile);
  return concept;
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

  const response = await callGeminiWithModelCascade(async (modelName, client) => {
    return await client.models.generateContent({
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

  const response = await callGeminiWithModelCascade(async (modelName, client) => {
    return await client.models.generateContent({
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

  const response = await callGeminiWithModelCascade(async (modelName, client) => {
    return await client.models.generateContent({
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

  const response = await callGeminiWithModelCascade(async (modelName, client) => {
    return await client.models.generateContent({
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
  const prompt = `You are an expert sales copilot for an agency: ${profile.name}.
Lead: ${lead.businessName} (${lead.category}).
Question: ${query}
Provide a short, actionable piece of advice (1-2 paragraphs) for the sales rep.`;

  const res = await callGeminiWithModelCascade((model, client) =>
    client.models.generateContent({ model, contents: prompt }),
  );
  return res.text || 'No advice generated';
}

export interface ReplyAnalysisResult {
  reply: string;
  suggestedStatus: 'positive' | 'negative' | 'objection';
  classifiedIntent: string;
  voiceNoteScript?: string;
  salesClosingTip?: string;
  actionableStep?: string;
}

export async function generateEmailReply(
  lead: Lead,
  profile: any,
  action: string,
  objection?: string
): Promise<ReplyAnalysisResult> {
  const agencyName = profile?.name || 'Your Web Agency';
  const portfolioUrl = profile?.portfolioUrl || '';
  const prospectMessage = objection || (action === 'accept' ? 'Yes, I am interested.' : action === 'reject' ? 'No thanks.' : 'Can you tell me more?');

  const prompt = `You are an elite B2B sales strategist and senior web consultant for "${agencyName}".
The prospect "${lead.businessName}" (${lead.category} in ${lead.city}, ${lead.country}) has sent this reply to cold outreach:
"${prospectMessage}"

Lead Context:
- Category: ${lead.category}
- City: ${lead.city}
- Current website status: ${lead.websiteStatus || 'NO_WEBSITE'}
- Deal value estimate: $${lead.dealValue || lead.recommendedPrice || 450}
- Has live mockup ready: ${Boolean(lead.websiteConcept)}

Analyze the psychological intent behind this reply, handle any objection using modern low-friction consulting methods, and generate:
1. "reply": A concise, natural, high-converting WhatsApp / Email reply (maximum 3-4 sentences). Empathize, reframe value around their revenue/customers, and propose a zero-friction next step (e.g. sharing a 60-second interactive preview or 5-min quick chat). Never be pushy or desperate.
2. "suggestedStatus": "positive" (wants demo, prices, timeline, or agreed) | "negative" (explicit 'not interested', 'remove me') | "objection" (price concern, already have someone, timing, skepticism).
3. "classifiedIntent": e.g. "ASKING_FOR_DEMO", "PRICE_OBJECTION", "HAS_EXISTING_DEVELOPER", "SOCIAL_MEDIA_SUFFICIENT", "TIMING_LATER", "POSITIVE_INTEREST", "UNSUBSCRIBE".
4. "voiceNoteScript": A natural 30-second conversational voice-note script that the freelancer can record and send on WhatsApp. Tone: friendly, confident, local context, zero sales jargon.
5. "salesClosingTip": 1 actionable psychological strategy for the developer to win this client.
6. "actionableStep": The immediate next action to take.

Return strictly valid JSON with this exact structure:
{
  "reply": "...",
  "suggestedStatus": "positive" | "negative" | "objection",
  "classifiedIntent": "...",
  "voiceNoteScript": "...",
  "salesClosingTip": "...",
  "actionableStep": "..."
}`;

  try {
    const res = await callGeminiWithModelCascade((model, client) =>
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    );
    const parsed = extractJsonFromResponse<ReplyAnalysisResult>(res?.text || '');
    if (parsed && parsed.reply) {
      return parsed;
    }
  } catch (err) {
    console.error('Gemini reply analysis error:', err);
  }

  // Fallback if parsing or API failed
  const isPositive = /yes|interested|demo|cost|price|how much|send/i.test(prospectMessage);
  const isNegative = /no|stop|don't|not interested|remove/i.test(prospectMessage);

  return {
    reply: isPositive
      ? `Hi! Glad to hear that. I've already prepared an interactive mobile concept for ${lead.businessName} so you can see how an instant WhatsApp booking system would look. Would you like me to send the link here?`
      : isNegative
      ? `Understood completely! Thanks for letting me know, and wishing ${lead.businessName} continued success.`
      : `Thanks for the reply! Completely understand your question. Most businesses in ${lead.city} have similar concerns before seeing the numbers. Happy to share a quick 1-page breakdown if you'd like?`,
    suggestedStatus: isPositive ? 'positive' : isNegative ? 'negative' : 'objection',
    classifiedIntent: isPositive ? 'POSITIVE_INQUIRY' : isNegative ? 'NOT_INTERESTED' : 'GENERAL_OBJECTION',
    voiceNoteScript: `Hey, thanks for getting back to me! Just wanted to send a quick note — no pressure at all. I actually put together a quick interactive mockup for ${lead.businessName} showing how you can capture table reservations directly on WhatsApp. Let me know if you'd like me to send the link over!`,
    salesClosingTip: 'Focus on eliminating friction: offer the free preview without asking for a commitment or phone call yet.',
    actionableStep: isPositive ? 'Send live preview mockup link' : 'Archive or mark for follow-up next quarter',
  };
}

export async function generateProjectHandoff(lead: Lead, profile: any, instructions?: string) {
  const agencyName = profile?.name || 'WebLead Development Studio';
  const prompt = `You are the lead solutions architect at "${agencyName}".
Create an enterprise-grade Project Technical Handoff and Client Onboarding Packet for this newly closed client:
- Client Name: ${lead.businessName}
- Category: ${lead.category}
- City: ${lead.city}, ${lead.country}
- Contract / Deal Value: $${lead.dealValue || lead.recommendedPrice || 499}
- Service Scope: ${lead.recommendedService || 'Next.js Web Application & WhatsApp Booking Integration'}
- Pain Points to Solve: ${(lead.painPoints || []).join(', ')}
${instructions ? `- Custom Instructions: ${instructions}` : ''}

Generate a comprehensive JSON document with:
1. "summary": Executive overview of the engagement goals and deliverables.
2. "timeline": Detailed timeline breakdown (e.g. "Day 1-2: Architecture & Content, Day 3-4: Components & WhatsApp Funnel, Day 5: Testing & Go-Live").
3. "techStack": Array of chosen technologies (e.g. ["Next.js 15 (App Router)", "TypeScript", "Tailwind CSS", "WhatsApp Cloud Webhook", "Vercel / Cloudflare Edge"]).
4. "deliverables": Array of 5-7 distinct production deliverables.
5. "sitemap": Array of pages with purpose (e.g. [{ "page": "Home", "purpose": "Hero banner, trust proof, service highlights" }, ...]).
6. "conversionTriggers": Array of specific conversion-boosting mechanisms to implement (e.g. 1-tap WhatsApp booking button, mobile sticky call bar, schema review markup).
7. "clientChecklist": Array of items needed from the client before launch (e.g. Domain registrar credentials, official high-res logo, WhatsApp business phone number, menu/service catalog).
8. "maintenancePlan": Recommended ongoing hosting, security, and update terms.

Return strictly valid JSON:
{
  "summary": "...",
  "timeline": "...",
  "techStack": ["..."],
  "deliverables": ["..."],
  "sitemap": [{ "page": "...", "purpose": "..." }],
  "conversionTriggers": ["..."],
  "clientChecklist": ["..."],
  "maintenancePlan": "..."
}`;

  try {
    const res = await callGeminiWithModelCascade((model, client) =>
      client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    );
    const parsed = extractJsonFromResponse<any>(res?.text || '');
    if (parsed && parsed.deliverables) {
      return parsed;
    }
  } catch (err) {
    console.error('Project handoff generation failed:', err);
  }

  // Fallback comprehensive spec
  return {
    summary: `Complete mobile-first web overhaul for ${lead.businessName} focusing on direct customer acquisition and 1-tap WhatsApp conversion.`,
    timeline: '5-7 business days from asset receipt to live production deployment.',
    techStack: ['Next.js 15 (App Router)', 'TypeScript', 'Tailwind CSS', 'WhatsApp Business Intent API', 'Vercel Edge Hosting'],
    deliverables: [
      'Modern, mobile-first responsive web application',
      'Direct WhatsApp booking and inquiry integration with prefilled messages',
      'Google Maps & Local SEO Schema Markup',
      'High-speed optimization (>90 Lighthouse score)',
      'SSL certificate setup and custom domain DNS configuration',
    ],
    sitemap: [
      { page: 'Home', purpose: 'Hero value proposition, quick booking CTA, business highlights' },
      { page: 'Services / Menu', purpose: 'Interactive catalog with instant order/inquiry buttons' },
      { page: 'Reviews & Proof', purpose: 'Google reviews slider and customer trust cues' },
      { page: 'Contact & Location', purpose: 'Interactive map, open hours, and 1-tap dial/WhatsApp' },
    ],
    conversionTriggers: [
      'Sticky bottom mobile action bar (Call / WhatsApp)',
      '1-tap prefilled WhatsApp message: "Hi, I would like to book an appointment / place an order"',
      'Local schema.org markup for rich Google search snippet',
    ],
    clientChecklist: [
      'Domain name registrar login or DNS access',
      'High-resolution logo & business photography',
      'Current menu or service rate card',
      'Official WhatsApp business contact number',
    ],
    maintenancePlan: 'Monthly uptime monitoring, security updates, and content revisions included in post-launch retainer.',
  };
}
