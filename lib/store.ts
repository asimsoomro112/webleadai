import { calculateLeadScore, DEFAULT_SCORING_WEIGHTS, determineNextBestAction } from './scorer';
import {
  AgentTask,
  AnalyticsMetrics,
  ApiKeyPoolSettings,
  ApiKeyStatus,
  AppNotification,
  AppSettings,
  BusinessProfile,
  GeminiKeyConfig,
  Lead,
  LeadActivity,
  OutreachChannel,
  PipelineStatus,
  PricingTier,
  ProjectHandoff,
  Proposal,
  WebsiteConcept,
} from './types';

export const DEFAULT_PROFILE: BusinessProfile = {
  name: 'Muhammad Asim',
  title: 'Full-Stack Web & Next.js Growth Engineer',
  portfolioUrl: 'https://asim-portfolio.dev',
  email: 'muhammadasimxxx@gmail.com',
  phone: '+92 300 1234567',
  whatsapp: '+92 300 1234567',
  location: 'Karachi, Pakistan',
  experienceYears: 5,
  services: [
    'Custom Next.js 15 & React Web Development',
    'High-Converting Mobile-First Redesigns',
    'Instant WhatsApp & Online Booking Funnels',
    'Local SEO & Google Maps Optimization',
    'E-Commerce & Digital Menus',
  ],
  techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Node.js'],
  specialOffer: 'Compliant 2-Page Interactive Prototype & Strategy Session before any commitment.',
};

export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  {
    id: 'STARTER',
    name: 'Starter Launchpad',
    price: 199,
    description: 'Perfect for small local shops, cafes, and solo professionals needing a fast modern web presence.',
    features: [
      '1 to 3 Fast Responsive Pages',
      'Mobile-First Layout & Fast Loading',
      'Direct WhatsApp & Phone CTA Button',
      'Google Maps Embed & Basic SEO',
      'Contact & Inquiry Form',
    ],
    turnaroundDays: 5,
  },
  {
    id: 'PROFESSIONAL',
    name: 'Business Growth',
    price: 499,
    description: 'Comprehensive solution for established restaurants, clinics, salons, gyms, and local services.',
    features: [
      '5 to 8 Custom Pages & CMS Integration',
      'Interactive Menu / Service Catalog / Gallery',
      'Instant WhatsApp Booking & Table Reservation',
      'Advanced Local SEO & Schema Markup',
      'Customer Reviews & Testimonials Showcase',
      'Speed Optimization (95+ Lighthouse)',
    ],
    turnaroundDays: 10,
  },
  {
    id: 'PREMIUM',
    name: 'Full Digital Scale',
    price: 999,
    description: 'Complete high-converting digital platform with custom automations, CRM integration, and online ordering.',
    features: [
      'Unlimited Pages & Custom Next.js Architecture',
      'Online Ordering / Patient Scheduling System',
      'Multi-Location Support & Filterable Listings',
      'Analytics, Conversion Tracking & Pixel Setup',
      '1 Month Dedicated Maintenance & Support',
    ],
    turnaroundDays: 18,
  },
];

export function maskApiKey(raw: string): string {
  if (!raw) return '****';
  const trimmed = raw.trim();
  if (trimmed.length <= 8) return '****' + trimmed.slice(-4);
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

export const DEFAULT_SETTINGS: AppSettings = {
  profile: DEFAULT_PROFILE,
  pricingTiers: DEFAULT_PRICING_TIERS,
  scoringWeights: DEFAULT_SCORING_WEIGHTS,
  apiKeyPool: {
    keys: [],
    autoRotateOnQuota: true,
  },
  targetIndustries: [
    'Restaurants & Cafes',
    'Salons & Barbers',
    'Gyms & Fitness Centers',
    'Dental & Medical Clinics',
    'Real Estate Agencies',
    'Auto Workshops & Dealerships',
    'Boutiques & Retailers',
    'Construction & Cleaning',
  ],
  targetLocations: ['Karachi', 'Lahore', 'Islamabad', 'Dubai', 'London', 'Austin'],
  dailyOutreachLimit: 25,
  humanApprovalRequired: true,
  integrations: [
    {
      id: 'int_email',
      name: 'Email (SMTP / Resend)',
      type: 'EMAIL',
      status: 'CONNECTED',
      complianceLevel: 'DIRECT_API',
      description: 'Official API integration with rate-limiting, unsubscribes, and template validation.',
      details: 'Rate limit: Max 25 emails/day. RFC compliant opt-out footer included.',
    },
    {
      id: 'int_whatsapp',
      name: 'WhatsApp Business API & Web Intent',
      type: 'WHATSAPP',
      status: 'CONNECTED',
      complianceLevel: 'WEB_INTENT',
      description: 'Direct deep-link chat launcher with pre-filled personalized proposal pitch.',
      details: 'Launches official WhatsApp Web / Mobile app with personalized draft for 1-click human sending.',
    },
    {
      id: 'int_instagram',
      name: 'Instagram Direct (Graph API / Manual)',
      type: 'INSTAGRAM',
      status: 'REQUIRES_SETUP',
      complianceLevel: 'MANUAL_APPROVAL_REQUIRED',
      description: 'Requires Meta Business verification or manual copy-paste workflow to prevent policy flags.',
      details: 'Compliant one-click copy button with human approval flow.',
    },
    {
      id: 'int_linkedin',
      name: 'LinkedIn Messaging',
      type: 'LINKEDIN',
      status: 'REQUIRES_SETUP',
      complianceLevel: 'MANUAL_APPROVAL_REQUIRED',
      description: 'Professional B2B outreach for real estate, dental clinics, and corporate services.',
      details: 'Direct profile launcher with tailored connection note.',
    },
  ],
  onboardingCompleted: true,
};

export const SEED_LEADS: Lead[] = [
  {
    id: 'lead_1',
    businessName: 'Kolachi Coast Bistro & Grill',
    category: 'Restaurant',
    city: 'Karachi',
    country: 'Pakistan',
    address: 'Beach Avenue, Do Darya, Phase 8, Karachi',
    websiteUrl: undefined,
    websiteStatus: 'NO_WEBSITE',
    phone: '+92 300 8291042',
    email: 'info@kolachicoast.local',
    socials: {
      instagram: 'https://instagram.com/kolachibistro',
      facebook: 'https://facebook.com/kolachicoast',
      googleMaps: 'https://maps.google.com/?q=Kolachi+Karachi',
    },
    description: 'Prominent seaside seafood and barbecue dining spot with high weekend foot traffic and 4.7-star rating across 1,800+ reviews.',
    googleRating: 4.7,
    googleReviewCount: 1840,
    growthSignals: ['Opened expanded outdoor seaside terrace', 'Over 45k Instagram followers', 'Busiest Friday night waitlist'],
    estimatedSize: '30-50 staff',
    painPoints: [
      'No digital menu or direct online ordering funnel',
      'Customers constantly calling busy phone lines for reservations',
      'Heavy reliance on 3rd party aggregators charging 20%+ commission',
    ],
    recommendedService: 'Next.js Digital Menu + Instant WhatsApp Table Booking Funnel',
    recommendedPrice: 550,
    status: 'MESSAGE_READY',
    primaryChannel: 'WHATSAPP',
    channelCompliance: 'WEB_INTENT',
    dealValue: 550,
    verification: {
      phoneStatus: 'VERIFIED',
      emailStatus: 'LIKELY',
      addressStatus: 'VERIFIED',
      websiteStatus: 'UNVERIFIED',
      sourceAttribution: 'Google Maps Local Discovery',
    },
    opportunityProfile: {
      websiteStatus: 'NO_WEBSITE',
      mobileQuality: 'NONE',
      speedEstimate: 0,
      seoQuality: 'CRITICAL',
      conversionQuality: 'HIGH_FRICTION',
      bookingCapability: false,
      whatsappCapability: true,
      onlineOrdering: false,
      socialPresence: 'STRONG',
      digitalGaps: [
        'No official standalone website',
        'No digital interactive menu',
        'No direct WhatsApp table reservation link',
        'Zero structured local Google schema',
      ],
      opportunityLevel: 'EXTREME',
    },
    competitorGap: {
      competitorsFound: [
        {
          competitorName: 'Kababjees Do Darya',
          hasModernWebsite: true,
          hasOnlineBooking: true,
          hasWhatsAppCTA: true,
          hasOnlineOrdering: true,
          googleRating: 4.6,
          reviewCount: 3200,
          keyAdvantage: 'Allows diners to browse menu and book a seaside table directly in 30 seconds.',
        },
      ],
      competitiveGapSummary: 'Nearby seaside competitors capture 200+ direct website reservations every weekend, saving $1,500+ in aggregator fees.',
      lostOpportunityEstimateMonthly: '$2,000 - $4,500 in direct orders and missed bookings',
      recommendedDifferentiators: [
        'Instant 1-tap WhatsApp table booking',
        'Mobile-first high-resolution seafood menu',
        'Direct directions launcher for valet & parking',
      ],
    },
    websiteConcept: {
      id: 'wc_kolachi_1',
      previewId: 'kolachi-coast',
      leadId: 'lead_1',
      version: 1,
      createdAt: '2026-08-20T10:00:00Z',
      sitemap: ['Home', 'Seaside Menu', 'Table Booking', 'Private Events', 'Location & Valet'],
      headline: 'Karachi’s Premier Seaside Barbecue & Fresh Seafood Dining',
      subheadline: 'Experience sunset over the Arabian Sea at Do Darya. Reserve your seaside table directly via WhatsApp with zero wait time.',
      primaryCTA: 'Reserve Seaside Table via WhatsApp',
      secondaryCTA: 'Explore Live Grill & Seafood Menu',
      colorPalette: {
        primary: '#090D16',
        secondary: '#0284C7',
        accent: '#F59E0B',
        background: '#0B1120',
      },
      serviceSections: [
        {
          name: 'Signature Do Darya Handi & Karahi',
          description: 'Slow-cooked in pure desi ghee with aromatic spices, served piping hot on the seaside terrace.',
          iconName: 'Flame',
          priceStartingAt: 'From Rs. 1,850',
        },
        {
          name: 'Fresh Arabian Catch & Grilled Prawns',
          description: 'Sourced daily from Karachi harbor, marinated in our secret coastal rub and grilled over open charcoal.',
          iconName: 'Fish',
          priceStartingAt: 'From Rs. 2,400',
        },
        {
          name: 'Live Sajji & Charcoal Kebabs',
          description: 'Tender Balochi style lamb and chicken sajji slow-roasted to crispy perfection.',
          iconName: 'Sparkles',
          priceStartingAt: 'From Rs. 1,600',
        },
      ],
      socialProofSection: {
        title: 'Loved by Over 100,000 Karachi Diners',
        highlightReviews: [
          {
            reviewer: 'Hamza Farooq',
            quote: 'Unmatched seaside ambiance at Do Darya. The mutton ribs and prawns are consistently world-class.',
            rating: 5,
          },
          {
            reviewer: 'Ayesha Siddiqui',
            quote: 'Our family tradition for weekend dinners. Booking online via WhatsApp made entering with a large group seamless!',
            rating: 5,
          },
        ],
      },
      contactSection: {
        address: 'Do Darya, Beach Avenue, Phase 8, DHA, Karachi',
        phone: '+92 300 8291042',
        hours: 'Daily: 6:00 PM - 2:00 AM (Seaside Terrace)',
        whatsappPrompt: 'Tap below to book a table directly with our guest relations manager.',
      },
      bookingCTA: {
        title: 'Planning a Seaside Dinner Tonight?',
        description: 'Reserve in under 30 seconds. Instant table confirmation sent straight to your WhatsApp.',
        buttonText: 'Book Table via WhatsApp',
      },
      seoMeta: {
        title: 'Kolachi Coast Bistro & Grill - Top Seafood at Do Darya Karachi',
        description: 'Dine seaside at Do Darya, Karachi. World-class grilled seafood, Balochi sajji, and instant WhatsApp table reservations.',
        keywords: ['Kolachi Karachi', 'Do Darya restaurant', 'seafood Karachi', 'Karachi seaside dining'],
      },
    },
    conversationMemory: {
      leadId: 'lead_1',
      messages: [],
      currentIntent: 'UNASSIGNED',
      objectionNotes: [],
      buyingSignals: ['Huge customer volume', 'High review engagement'],
      extractedFacts: ['Owner is interested in reducing phone call load'],
      updatedAt: '2026-08-20T09:35:00Z',
    },
    scoreBreakdown: {
      totalScore: 95,
      tier: 'HOT',
      factors: [
        { name: 'Digital Need', points: 20, maxPoints: 20, description: 'No website presence whatsoever.' },
        { name: 'Business Quality', points: 20, maxPoints: 20, description: '4.7★ across 1,840+ reviews.' },
        { name: 'Revenue Potential', points: 15, maxPoints: 15, description: 'Seaside dining with high average spend.' },
        { name: 'Contactability', points: 15, maxPoints: 15, description: 'Verified direct mobile & WhatsApp.' },
        { name: 'Buying Signals', points: 15, maxPoints: 15, description: 'Terrace expansion and busy weekend waitlists.' },
        { name: 'Competitive Gap', points: 10, maxPoints: 15, description: 'Nearby competitors offer direct online booking.' },
      ],
      reasoning: 'Exceptional reputation and volume with zero standalone web asset. Massive ROI from direct ordering & booking.',
    },
    websiteAudit: {
      score: 10,
      hasHttps: false,
      isMobileResponsive: false,
      pageSpeedEstimate: 0,
      designQuality: 'POOR',
      hasClearCTA: false,
      hasContactFunnel: false,
      seoBasicsScore: 10,
      problems: ['No website found on domain', 'Zero structured local schema', 'No online menu catalog'],
      opportunities: ['Deploy modern Next.js responsive website', 'Add instant WhatsApp reservation trigger', 'Save thousands in food app commissions'],
      redesignValue: 'HIGH',
      executiveSummary: 'Zero digital web presence despite ranking as one of the most visited seaside restaurants in Karachi.',
      businessImpact: 'Losing high-margin direct orders and reservation clarity to aggregators and congested phone lines.',
      technicalQuality: 'No existing codebase. Clean slate for Next.js 15 App Router architecture.',
      ctaQuality: 'No digital call to action exists.',
      modernityScore: 10,
      suggestedFeatures: ['Instant WhatsApp Table Booking', 'Mobile-First Seafood Menu', 'Interactive Location Map & Valet directions'],
      suggestedPackage: 'PROFESSIONAL',
      metricTypes: {
        pageSpeedEstimate: 'ESTIMATED',
        seoBasicsScore: 'AI_INFERRED',
        hasHttps: 'MEASURED',
        isMobileResponsive: 'AI_INFERRED',
      },
      lastAuditedAt: '2026-08-20T10:00:00Z',
    },
    generatedSubject: 'Idea for Kolachi Coast: Direct WhatsApp table booking & online menu',
    generatedMessage: `Hi Kolachi Coast Team,

I came across your restaurant while looking at the top dining destinations in Karachi. Your 4.7★ rating from 1,800+ guests is incredible!

However, I noticed you currently don't have an official mobile website where diners can view your full menu with prices and book a table directly. A lot of diners searching on Google end up with busy phone lines or outdated PDF photos on social media.

I'm a local web developer who builds fast, mobile-friendly websites with instant WhatsApp ordering and table reservations for Karachi restaurants.

I put together a live interactive mockup concept of how Kolachi's digital menu and 1-tap WhatsApp booking could look:
https://asim-portfolio.dev

Would you be open to taking a 2-minute look at the concept?

Best regards,
Muhammad Asim
WhatsApp: +92 300 1234567 | Email: muhammadasimxxx@gmail.com`,
    followUpSequence: [
      {
        day: 0,
        type: 'INITIAL',
        subject: 'Idea for Kolachi Coast: Direct WhatsApp table booking & online menu',
        body: `Hi Kolachi Coast Team,\n\nI noticed you don't have a dedicated website for your digital menu and table reservations. I put together a quick design concept that lets diners reserve via WhatsApp in 1 click. Check out my work: https://asim-portfolio.dev - Happy to share the concept preview!`,
        channel: 'WHATSAPP',
        status: 'APPROVED',
      },
      {
        day: 3,
        type: 'QUICK_FOLLOWUP',
        subject: 'Re: Kolachi Coast online menu concept',
        body: `Hi team, just following up! Did you get a chance to review the idea for an interactive menu with WhatsApp table bookings? Happy to send a quick mockup video whenever convenient.`,
        channel: 'WHATSAPP',
        status: 'DRAFT',
      },
      {
        day: 7,
        type: 'VALUE_ADD',
        subject: 'Value idea: Save 20% aggregator fees',
        body: `Hey Kolachi team, wanted to share that a direct WhatsApp ordering website typically saves local restaurants 15-20% in delivery aggregator commission fees each month while giving you direct customer phone numbers for repeat promotions.`,
        channel: 'WHATSAPP',
        status: 'DRAFT',
      },
    ],
    notes: ['High-value prospect. Very active on Instagram stories between 5 PM - 8 PM.'],
    activities: [
      {
        id: 'act_1',
        timestamp: '2026-08-20T09:30:00Z',
        type: 'DISCOVERED',
        title: 'Discovered via Google Search Discovery Engine',
        details: 'Found under category: Restaurants, Location: Karachi',
      },
      {
        id: 'act_2',
        timestamp: '2026-08-20T09:32:00Z',
        type: 'SCORED',
        title: 'Opportunity Scored: 95/100 (HOT)',
        details: 'Classified as Top Priority Prospect due to high foot traffic and zero website.',
      },
    ],
    proposals: [],
    discoveredAt: '2026-08-20T09:30:00Z',
    updatedAt: '2026-08-20T09:35:00Z',
  },
  {
    id: 'lead_2',
    businessName: 'Apex Spine & Orthopedic Clinic',
    category: 'Dental Clinic',
    city: 'Lahore',
    country: 'Pakistan',
    address: 'Gulberg III, MM Alam Road, Lahore',
    websiteUrl: 'http://apexortho-pk.com',
    websiteStatus: 'OUTDATED_WEBSITE',
    phone: '+92 321 9988776',
    email: 'care@apexortho.local',
    socials: {
      facebook: 'https://facebook.com/apexspineortho',
      googleMaps: 'https://maps.google.com/?q=Apex+Orthopedic+Lahore',
    },
    description: 'Specialist spine and joint rehabilitation clinic with 3 senior consultants. Existing HTTP website built over 8 years ago with broken mobile viewport.',
    googleRating: 4.8,
    googleReviewCount: 290,
    growthSignals: ['Introduced laser therapy equipment', 'Opening evening consultation wing'],
    estimatedSize: '12-18 staff',
    painPoints: [
      'Website fails security check (No HTTPS/SSL certificate warning in Chrome)',
      'Broken mobile layout forces patients to pinch-to-zoom on doctors schedule',
      'No online appointment request form or clinic direction map',
    ],
    recommendedService: 'Modern Medical Practice Website + HIPAA/Data Compliant Patient Intake + WhatsApp Booking',
    recommendedPrice: 750,
    status: 'QUALIFIED',
    primaryChannel: 'EMAIL',
    channelCompliance: 'DIRECT_API',
    dealValue: 750,
    verification: {
      phoneStatus: 'VERIFIED',
      emailStatus: 'VERIFIED',
      addressStatus: 'VERIFIED',
      websiteStatus: 'VERIFIED',
      sourceAttribution: 'Lahore Medical Directory & Google Grounding',
    },
    opportunityProfile: {
      websiteStatus: 'OUTDATED_WEBSITE',
      mobileQuality: 'POOR',
      speedEstimate: 32,
      seoQuality: 'CRITICAL',
      conversionQuality: 'HIGH_FRICTION',
      bookingCapability: false,
      whatsappCapability: true,
      onlineOrdering: false,
      socialPresence: 'MODERATE',
      digitalGaps: [
        'Browser flags website as Not Secure (No SSL)',
        'Desktop-only table layout breaks on smartphones',
        'No direct digital consultation booking',
      ],
      opportunityLevel: 'HIGH',
    },
    competitorGap: {
      competitorsFound: [
        {
          competitorName: 'Lahore Orthopedic & Spine Center',
          hasModernWebsite: true,
          hasOnlineBooking: true,
          hasWhatsAppCTA: true,
          hasOnlineOrdering: false,
          googleRating: 4.7,
          reviewCount: 410,
          keyAdvantage: 'Online doctor slot selector with SMS confirmation.',
        },
      ],
      competitiveGapSummary: 'Competitors rank #1 for spine treatment in Gulberg and offer 1-click patient appointment confirmation.',
      lostOpportunityEstimateMonthly: '$3,000 - $6,000 in missed private consultations',
      recommendedDifferentiators: [
        'HIPAA & privacy-compliant digital intake form',
        'Doctor profiles with video introductions',
        'Instant WhatsApp clinic secretary booking trigger',
      ],
    },
    websiteConcept: {
      id: 'wc_apex_1',
      previewId: 'apex-spine',
      leadId: 'lead_2',
      version: 1,
      createdAt: '2026-08-21T11:00:00Z',
      sitemap: ['Home', 'Treatments', 'Specialist Doctors', 'Patient Stories', 'Book Consultation'],
      headline: 'Restoring Mobility & Pain-Free Living in Lahore',
      subheadline: 'Specialized spine, joint, and orthopedic care by senior consultants. Schedule your consultation online with zero waiting time.',
      primaryCTA: 'Book Doctor Consultation',
      secondaryCTA: 'View Specializations & Doctors',
      colorPalette: {
        primary: '#0F172A',
        secondary: '#0D9488',
        accent: '#14B8A6',
        background: '#F0FDFA',
      },
      serviceSections: [
        {
          name: 'Non-Surgical Spine Decompression',
          description: 'Advanced spinal therapy targeting herniated discs and sciatica with proven clinical recovery rates.',
          iconName: 'Activity',
          priceStartingAt: 'Consultation: Rs. 3,500',
        },
        {
          name: 'Joint Rehabilitation & Arthroscopy',
          description: 'Minimally invasive joint treatments and guided physiotherapy for knee, shoulder, and hip pain.',
          iconName: 'Shield',
          priceStartingAt: 'Consultation: Rs. 3,500',
        },
      ],
      socialProofSection: {
        title: 'Trusted by 10,000+ Recovered Patients',
        highlightReviews: [
          {
            reviewer: 'Brig. (R) Khalid N.',
            quote: 'After 6 months of chronic back pain, Dr. Tariq restored my normal walking in 4 sessions. Outstanding team.',
            rating: 5,
          },
        ],
      },
      contactSection: {
        address: 'MM Alam Road, Gulberg III, Lahore',
        phone: '+92 321 9988776',
        hours: 'Mon - Sat: 10:00 AM - 8:00 PM',
        whatsappPrompt: 'Chat with our clinic desk to choose a morning or evening doctor slot.',
      },
      bookingCTA: {
        title: 'Suffering from chronic back or joint pain?',
        description: 'Book your examination with our senior consultant today.',
        buttonText: 'Book Appointment via WhatsApp',
      },
      seoMeta: {
        title: 'Apex Spine & Orthopedic Clinic - Gulberg Lahore',
        description: 'Leading orthopedic and spine rehabilitation clinic on MM Alam Road, Lahore. Book appointment with specialist consultants.',
        keywords: ['orthopedic clinic Lahore', 'spine specialist Gulberg', 'best joint doctor Lahore'],
      },
    },
    conversationMemory: {
      leadId: 'lead_2',
      messages: [],
      currentIntent: 'UNASSIGNED',
      objectionNotes: [],
      buyingSignals: ['High rating clinic', 'Expanding wings'],
      extractedFacts: [],
      updatedAt: '2026-08-21T11:05:00Z',
    },
    scoreBreakdown: {
      totalScore: 88,
      tier: 'HIGH',
      factors: [
        { name: 'Digital Need', points: 18, maxPoints: 20, description: 'Outdated HTTP site with security warnings.' },
        { name: 'Business Quality', points: 18, maxPoints: 20, description: '4.8★ with 290+ reviews and 3 senior doctors.' },
        { name: 'Revenue Potential', points: 14, maxPoints: 15, description: 'High lifetime value per orthopedic patient.' },
        { name: 'Contactability', points: 14, maxPoints: 15, description: 'Verified clinic phone, email, and location.' },
        { name: 'Buying Signals', points: 12, maxPoints: 15, description: 'Adding evening wings and laser therapy equipment.' },
        { name: 'Competitive Gap', points: 12, maxPoints: 15, description: 'Nearby clinics offer online appointment booking.' },
      ],
      reasoning: 'Established healthcare clinic losing patients due to an insecure, non-mobile website.',
    },
    websiteAudit: {
      score: 28,
      hasHttps: false,
      isMobileResponsive: false,
      pageSpeedEstimate: 32,
      designQuality: 'POOR',
      hasClearCTA: false,
      hasContactFunnel: false,
      seoBasicsScore: 25,
      problems: [
        'Browser shows "Not Secure" warning to patients',
        'Viewport not optimized for modern smartphones',
        'Outdated doctor profiles from 2017',
      ],
      opportunities: [
        'Upgrade to Next.js with instant SSL certification',
        'Add doctor profiles and 1-click WhatsApp appointment confirmation',
        'Improve local Google rankings for "orthopedic specialist in Lahore"',
      ],
      redesignValue: 'HIGH',
      executiveSummary: 'Non-secure legacy HTTP website that erodes patient trust and fails on smartphones.',
      businessImpact: 'High-income private patients abandon the site when Chrome displays a Not Secure warning.',
      technicalQuality: 'Legacy PHP 5 CMS with unmaintained plugins and no mobile meta viewport.',
      ctaQuality: 'No appointment or phone trigger on mobile.',
      modernityScore: 25,
      suggestedFeatures: ['SSL Security & Modern Next.js Framework', 'Doctor Bio Cards', '1-Click WhatsApp Appointment Scheduler'],
      suggestedPackage: 'PREMIUM',
      metricTypes: {
        pageSpeedEstimate: 'ESTIMATED',
        seoBasicsScore: 'AI_INFERRED',
        hasHttps: 'MEASURED',
        isMobileResponsive: 'MEASURED',
      },
      lastAuditedAt: '2026-08-21T11:00:00Z',
    },
    followUpSequence: [],
    notes: ['Contact Dr. Tariq or Clinic Coordinator via morning email.'],
    activities: [
      {
        id: 'act_3',
        timestamp: '2026-08-21T11:00:00Z',
        type: 'DISCOVERED',
        title: 'Discovered in Lahore Clinics directory',
      },
    ],
    proposals: [],
    discoveredAt: '2026-08-21T11:00:00Z',
    updatedAt: '2026-08-21T11:05:00Z',
  },
  {
    id: 'lead_3',
    businessName: 'Vanguard Fitness & Martial Arts',
    category: 'Gym',
    city: 'Islamabad',
    country: 'Pakistan',
    address: 'Sector F-7/2, Markaz, Islamabad',
    websiteUrl: undefined,
    websiteStatus: 'NO_WEBSITE',
    phone: '+92 333 5544332',
    email: 'join@vanguardgym.local',
    socials: {
      instagram: 'https://instagram.com/vanguardfitisb',
      facebook: 'https://facebook.com/vanguardfitnessisb',
    },
    description: 'Premier combat fitness and functional training facility in F-7 with 350+ members. Actively runs Instagram campaigns but has no landing page.',
    googleRating: 4.9,
    googleReviewCount: 160,
    growthSignals: ['Running sponsored Instagram ads', 'Added Brazilian Jiu-Jitsu program', 'High membership signups'],
    estimatedSize: '8 trainers',
    painPoints: [
      'Sending paid ad clicks directly to Instagram DM resulting in 60%+ lead abandonment',
      'No class timetable or membership pricing calculator online',
      'Trainers manually answering the same pricing questions all day',
    ],
    recommendedService: 'High-Converting Gym Landing Page + Class Schedule + Free 1-Day Trial Booking Funnel',
    recommendedPrice: 450,
    status: 'INTERESTED',
    primaryChannel: 'WHATSAPP',
    channelCompliance: 'WEB_INTENT',
    dealValue: 450,
    verification: {
      phoneStatus: 'VERIFIED',
      emailStatus: 'LIKELY',
      addressStatus: 'VERIFIED',
      websiteStatus: 'UNVERIFIED',
      sourceAttribution: 'Instagram Sponsored Ads & Google Maps',
    },
    opportunityProfile: {
      websiteStatus: 'NO_WEBSITE',
      mobileQuality: 'NONE',
      speedEstimate: 0,
      seoQuality: 'CRITICAL',
      conversionQuality: 'HIGH_FRICTION',
      bookingCapability: false,
      whatsappCapability: true,
      onlineOrdering: false,
      socialPresence: 'STRONG',
      digitalGaps: [
        'Wasting paid Meta ad clicks into dead-end Instagram DMs',
        'No digital weekly class schedule',
        'No 1-click free trial membership registration',
      ],
      opportunityLevel: 'EXTREME',
    },
    competitorGap: {
      competitorsFound: [
        {
          competitorName: 'Omni Athletic Club Islamabad',
          hasModernWebsite: true,
          hasOnlineBooking: true,
          hasWhatsAppCTA: true,
          hasOnlineOrdering: false,
          googleRating: 4.8,
          reviewCount: 300,
          keyAdvantage: 'Captures 1-day pass leads with instant SMS pass delivery.',
        },
      ],
      competitiveGapSummary: 'Vanguard spends an estimated $300-$500/mo on Instagram ads but loses 60% of clicks because prospects have to wait hours for a DM reply.',
      lostOpportunityEstimateMonthly: '$1,800 - $3,500 in lost gym memberships',
      recommendedDifferentiators: [
        'Instant 1-Click Free Trial Pass via WhatsApp',
        'Live Class Timetable with filter by Trainer / Program',
        'Transparent membership tiers with student & annual discounts',
      ],
    },
    websiteConcept: {
      id: 'wc_vanguard_1',
      previewId: 'vanguard-fitness',
      leadId: 'lead_3',
      version: 1,
      createdAt: '2026-08-22T08:00:00Z',
      sitemap: ['Home', 'Programs & BJJ', 'Timetable', 'Membership Tiers', 'Claim Free Pass'],
      headline: 'Islamabad’s Premier Combat Sports & Functional Strength Club',
      subheadline: 'Train with certified black belts and elite strength coaches in Sector F-7. Claim your complimentary 1-Day Trial Pass in 30 seconds.',
      primaryCTA: 'Claim Free 1-Day Trial Pass',
      secondaryCTA: 'View Weekly Class Schedule',
      colorPalette: {
        primary: '#0B0F19',
        secondary: '#EF4444',
        accent: '#F97316',
        background: '#030712',
      },
      serviceSections: [
        {
          name: 'Brazilian Jiu-Jitsu (Gi & No-Gi)',
          description: 'Authentic IBJJF curriculum taught by IBJJF recognized black belts. Beginner and advanced divisions.',
          iconName: 'Flame',
          priceStartingAt: 'Rs. 12,000 / month',
        },
        {
          name: 'Muay Thai & Striking Academy',
          description: 'High-intensity striking conditioning, heavy bag drills, pad work, and sparring under world champions.',
          iconName: 'Target',
          priceStartingAt: 'Rs. 10,000 / month',
        },
        {
          name: 'Functional Strength & Conditioning',
          description: 'Olympic lifting platforms, kettlebell conditioning, and personalized coach-guided circuits.',
          iconName: 'Dumbbell',
          priceStartingAt: 'Rs. 14,000 / month',
        },
      ],
      socialProofSection: {
        title: '350+ Active Islamabad Athletes',
        highlightReviews: [
          {
            reviewer: 'Danial Abbasi',
            quote: 'Best martial arts gym in the capital hands down. The community and coaching quality are unmatched.',
            rating: 5,
          },
        ],
      },
      contactSection: {
        address: 'Sector F-7/2, Markaz, Islamabad',
        phone: '+92 333 5544332',
        hours: 'Mon - Sat: 6:00 AM - 11:00 PM',
        whatsappPrompt: 'Tap to claim your free guest pass directly on WhatsApp.',
      },
      bookingCTA: {
        title: 'Ready to transform your strength and fitness?',
        description: 'Try any class for free this week. No credit card required.',
        buttonText: 'Claim Free Pass on WhatsApp',
      },
      seoMeta: {
        title: 'Vanguard Fitness & Martial Arts - F-7 Islamabad',
        description: 'Elite BJJ, Muay Thai, and functional strength club in Sector F-7, Islamabad. Claim your free 1-day guest pass today.',
        keywords: ['gym Islamabad', 'BJJ Islamabad', 'martial arts F-7', 'fitness club Islamabad'],
      },
    },
    conversationMemory: {
      leadId: 'lead_3',
      messages: [
        {
          id: 'msg_1',
          sender: 'DEVELOPER',
          channel: 'WHATSAPP',
          timestamp: '2026-08-22T09:00:00Z',
          messageText:
            'Hi Vanguard Fitness Team, I saw your Instagram ads for the F-7 gym and BJJ programs! I built a high-speed trial booking landing page concept for fitness clubs in Islamabad that routes passes straight to WhatsApp. Check out my work: https://asim-portfolio.dev - Would you like me to send a quick mockup preview?',
        },
        {
          id: 'msg_2',
          sender: 'PROSPECT',
          channel: 'WHATSAPP',
          timestamp: '2026-08-23T14:20:00Z',
          messageText: 'Hey Asim, yes actually! We get so many DMs asking for our class timetable and membership rates. Can you show us how the mockup looks for our F-7 gym?',
        },
      ],
      currentIntent: 'INTERESTED',
      objectionNotes: [],
      buyingSignals: ['Expressed immediate interest in solving DM drop-off', 'Wants to see the timetable mockup'],
      extractedFacts: ['Pain point: Too many DMs asking for class timetables and pricing'],
      updatedAt: '2026-08-23T14:22:00Z',
    },
    scoreBreakdown: {
      totalScore: 92,
      tier: 'HOT',
      factors: [
        { name: 'Digital Need', points: 19, maxPoints: 20, description: 'Spending money on ads without a conversion landing page.' },
        { name: 'Business Quality', points: 19, maxPoints: 20, description: '4.9★ rating with 350+ active gym members.' },
        { name: 'Revenue Potential', points: 14, maxPoints: 15, description: 'Recurring monthly memberships in affluent F-7 sector.' },
        { name: 'Contactability', points: 15, maxPoints: 15, description: 'Instant response on WhatsApp.' },
        { name: 'Buying Signals', points: 15, maxPoints: 15, description: 'Prospect actively asked to see the mockup preview.' },
        { name: 'Competitive Gap', points: 10, maxPoints: 15, description: 'Competitors capture online guest passes automatically.' },
      ],
      reasoning: 'Spending money on ads without a landing page is wasting marketing budget. Perfect client for quick ROI.',
    },
    websiteAudit: {
      score: 12,
      hasHttps: false,
      isMobileResponsive: false,
      pageSpeedEstimate: 0,
      designQuality: 'POOR',
      hasClearCTA: false,
      hasContactFunnel: false,
      seoBasicsScore: 15,
      problems: ['No website asset', 'Wasted advertising budget', 'No class booking system'],
      opportunities: ['Deploy single-page high-converting trial funnel', 'Automate WhatsApp reminder for trial classes'],
      redesignValue: 'HIGH',
      executiveSummary: 'High-energy fitness club wasting sponsored Instagram ad spend on manual DM messaging.',
      businessImpact: 'Prospective members abandon when not answered within 5 minutes on Instagram DMs.',
      technicalQuality: 'No existing website.',
      ctaQuality: 'None outside Instagram bio link.',
      modernityScore: 10,
      suggestedFeatures: ['1-Click WhatsApp Trial Pass Funnel', 'Filterable Weekly Class Timetable', 'Membership Tier Calculator'],
      suggestedPackage: 'PROFESSIONAL',
      metricTypes: {
        pageSpeedEstimate: 'ESTIMATED',
        seoBasicsScore: 'AI_INFERRED',
        hasHttps: 'MEASURED',
        isMobileResponsive: 'AI_INFERRED',
      },
      lastAuditedAt: '2026-08-22T08:00:00Z',
    },
    generatedSubject: 'Quick idea to double trial pass signups for Vanguard Fitness',
    generatedMessage: `Hi Vanguard Fitness Team,\n\nI saw your Instagram ads for the F-7 gym and BJJ programs! The facility and reviews look top tier.\n\nI noticed you currently don't have a dedicated landing page for new members to claim a free 1-day pass and view the weekly class schedule. Directing ad clicks to DMs often leads to 50%+ drop-off.\n\nI built a high-speed trial booking landing page concept for fitness clubs in Islamabad that routes passes straight to WhatsApp.\n\nCheck out my portfolio here: https://asim-portfolio.dev\n\nWould you like me to send a quick mockup preview for Vanguard?`,
    followUpSequence: [],
    notes: ['Manager replied on WhatsApp saying they want to see the mockup on Monday at 3 PM.'],
    activities: [
      {
        id: 'act_4',
        timestamp: '2026-08-22T08:00:00Z',
        type: 'DISCOVERED',
        title: 'Discovered via Islamabad Fitness search',
      },
      {
        id: 'act_5',
        timestamp: '2026-08-23T14:20:00Z',
        type: 'REPLY_RECEIVED',
        title: 'Prospect Replied on WhatsApp',
        details: 'Prospect expressed interest in seeing the class timetable mockup.',
      },
      {
        id: 'act_6',
        timestamp: '2026-08-23T14:22:00Z',
        type: 'STATUS_CHANGED',
        title: 'Status changed to INTERESTED',
      },
    ],
    proposals: [],
    discoveredAt: '2026-08-22T08:00:00Z',
    updatedAt: '2026-08-23T14:25:00Z',
  },
];

// Initialize seed leads with their calculated NextBestActions
for (const lead of SEED_LEADS) {
  lead.nextBestAction = determineNextBestAction(lead);
}

// In-Memory Database state
class AppStore {
  private leads: Lead[] = [];
  private settings: AppSettings = DEFAULT_SETTINGS;
  private agentTasks: AgentTask[] = [];
  private agentStatus: 'IDLE' | 'RUNNING' | 'PAUSED' = 'IDLE';
  private notifications: AppNotification[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    this.leads = [...SEED_LEADS];
    this.notifications = [
      {
        id: 'notif_1',
        title: 'HOT Lead Discovered!',
        message: 'Kolachi Coast Bistro (95/100) identified in Karachi with zero website.',
        type: 'HOT_LEAD',
        timestamp: new Date().toISOString(),
        read: false,
        leadId: 'lead_1',
      },
      {
        id: 'notif_2',
        title: 'Lead Reply Received!',
        message: 'Vanguard Fitness replied on WhatsApp requesting a website mockup.',
        type: 'REPLY',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        leadId: 'lead_3',
      },
    ];
    this.initialized = true;
  }

  // --- Leads ---
  public getLeads(): Lead[] {
    return this.leads;
  }

  public getLeadById(id: string): Lead | undefined {
    return this.leads.find((l) => l.id === id);
  }

  public getLeadByConceptPreviewId(previewId: string): Lead | undefined {
    return this.leads.find(
      (l) => l.websiteConcept?.previewId === previewId || l.id === previewId
    );
  }

  public addLead(leadData: Partial<Lead>): Lead {
    const scoreBreakdown = leadData.scoreBreakdown || calculateLeadScore(leadData, this.settings.scoringWeights);
    const newLead: Lead = {
      id: leadData.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      businessName: leadData.businessName || 'Unnamed Business',
      category: leadData.category || 'General Business',
      city: leadData.city || 'Karachi',
      country: leadData.country || 'Pakistan',
      address: leadData.address,
      websiteUrl: leadData.websiteUrl,
      websiteStatus: leadData.websiteStatus || (leadData.websiteUrl ? 'OUTDATED_WEBSITE' : 'NO_WEBSITE'),
      phone: leadData.phone,
      email: leadData.email,
      socials: leadData.socials || {},
      description: leadData.description || 'Discovered business opportunity',
      googleRating: leadData.googleRating || 4.5,
      googleReviewCount: leadData.googleReviewCount || 25,
      growthSignals: leadData.growthSignals || ['Active local operations'],
      estimatedSize: leadData.estimatedSize || '1-10 staff',
      websiteAudit: leadData.websiteAudit,
      scoreBreakdown,
      painPoints: leadData.painPoints || ['Missing modern conversion funnel'],
      recommendedService: leadData.recommendedService || 'Custom Next.js Website + WhatsApp Funnel',
      recommendedPrice: leadData.recommendedPrice || 450,
      status: leadData.status || 'NEW',
      primaryChannel: leadData.primaryChannel || 'WHATSAPP',
      channelCompliance: leadData.channelCompliance || 'WEB_INTENT',
      dealValue: leadData.dealValue || leadData.recommendedPrice || 450,
      generatedSubject: leadData.generatedSubject,
      generatedMessage: leadData.generatedMessage,
      followUpSequence: leadData.followUpSequence || [],
      notes: leadData.notes || [],
      activities: [
        {
          id: `act_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'DISCOVERED',
          title: 'Lead added to pipeline',
        },
        ...(leadData.activities || []),
      ],
      proposals: leadData.proposals || [],
      discoveredAt: leadData.discoveredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verification: leadData.verification,
      opportunityProfile: leadData.opportunityProfile,
      competitorGap: leadData.competitorGap,
      websiteConcept: leadData.websiteConcept,
      conversationMemory: leadData.conversationMemory,
    };

    // Calculate next best action
    newLead.nextBestAction = determineNextBestAction(newLead);

    // Deduplicate by business name and city
    const existingIndex = this.leads.findIndex(
      (l) =>
        l.businessName.toLowerCase() === newLead.businessName.toLowerCase() &&
        l.city.toLowerCase() === newLead.city.toLowerCase()
    );

    if (existingIndex >= 0) {
      const merged: Lead = {
        ...this.leads[existingIndex],
        ...newLead,
        id: this.leads[existingIndex].id,
        updatedAt: new Date().toISOString(),
      };
      merged.nextBestAction = determineNextBestAction(merged);
      this.leads[existingIndex] = merged;
      return merged;
    } else {
      this.leads.unshift(newLead);

      if (newLead.scoreBreakdown?.tier === 'HOT') {
        this.addNotification({
          title: 'New HOT Lead Added!',
          message: `${newLead.businessName} (${newLead.scoreBreakdown.totalScore}/100) added to pipeline.`,
          type: 'HOT_LEAD',
          leadId: newLead.id,
        });
      }

      return newLead;
    }
  }

  public updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const index = this.leads.findIndex((l) => l.id === id);
    if (index === -1) return null;

    const current = this.leads[index];
    const updated: Lead = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Always recalculate next best action
    updated.nextBestAction = determineNextBestAction(updated);

    // If status changed, log activity
    if (updates.status && updates.status !== current.status) {
      updated.activities = [
        {
          id: `act_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'STATUS_CHANGED',
          title: `Status moved from ${current.status} to ${updates.status}`,
        },
        ...updated.activities,
      ];

      if (updates.status === 'WON') {
        this.addNotification({
          title: '🎉 Client Won!',
          message: `Congratulations! ${updated.businessName} has been converted into a paying client ($${updated.dealValue}).`,
          type: 'PROPOSAL',
          leadId: updated.id,
        });
      }
    }

    this.leads[index] = updated;
    return updated;
  }

  public deleteLead(id: string): boolean {
    const initLen = this.leads.length;
    this.leads = this.leads.filter((l) => l.id !== id);
    return this.leads.length < initLen;
  }

  public addLeadActivity(leadId: string, activity: Omit<LeadActivity, 'id' | 'timestamp'>): void {
    const lead = this.getLeadById(leadId);
    if (!lead) return;
    const newAct: LeadActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...activity,
    };
    lead.activities = [newAct, ...lead.activities];
  }

  public addConversationMessage(
    leadId: string,
    message: {
      sender: 'DEVELOPER' | 'PROSPECT' | 'AGENT';
      channel: OutreachChannel;
      messageText: string;
    }
  ): Lead | null {
    const lead = this.getLeadById(leadId);
    if (!lead) return null;

    const currentMemory = lead.conversationMemory || {
      leadId,
      messages: [],
      currentIntent: 'UNASSIGNED',
      objectionNotes: [],
      buyingSignals: [],
      extractedFacts: [],
      updatedAt: new Date().toISOString(),
    };

    const newMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...message,
    };

    currentMemory.messages.push(newMsg);
    currentMemory.updatedAt = new Date().toISOString();

    const updates: Partial<Lead> = {
      conversationMemory: currentMemory,
    };

    if (message.sender === 'PROSPECT') {
      updates.status = 'REPLIED';
      this.addLeadActivity(leadId, {
        type: 'REPLY_RECEIVED',
        title: `Reply received via ${message.channel}`,
        details: `"${message.messageText.substring(0, 100)}"`,
      });
      this.addNotification({
        title: `Reply from ${lead.businessName}`,
        message: `Client sent: "${message.messageText.substring(0, 80)}..."`,
        type: 'REPLY',
        leadId,
      });
    }

    return this.updateLead(leadId, updates);
  }

  public setWebsiteConcept(leadId: string, concept: WebsiteConcept): Lead | null {
    const target = this.leads.find((l) => l.id === leadId || l.websiteConcept?.previewId === leadId);
    if (!target) return null;
    return this.updateLead(target.id, {
      websiteConcept: concept,
    });
  }

  public setProjectHandoff(leadId: string, handoff: ProjectHandoff): Lead | null {
    return this.updateLead(leadId, {
      projectHandoff: handoff,
    });
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    return this.settings;
  }

  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    return this.settings;
  }

  // --- Gemini API Key Pool Management ---
  public getApiKeyPool(): ApiKeyPoolSettings {
    if (!this.settings.apiKeyPool) {
      this.settings.apiKeyPool = {
        keys: [],
        autoRotateOnQuota: true,
      };
    }

    // Auto-seed system environment key if not already tracked
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && !this.settings.apiKeyPool.keys.some((k) => k.key === envKey || k.isSystemDefault)) {
      this.settings.apiKeyPool.keys.unshift({
        id: 'sys_env_gemini_key',
        name: 'System Default Key (GEMINI_API_KEY)',
        key: envKey,
        maskedKey: maskApiKey(envKey),
        status: 'ACTIVE',
        addedAt: new Date().toISOString(),
        successCount: 0,
        failureCount: 0,
        isSystemDefault: true,
      });
    }

    // Also support GEMINI_API_KEYS (comma-separated list in env)
    const envKeysList = process.env.GEMINI_API_KEYS;
    if (envKeysList) {
      const splitKeys = envKeysList.split(',').map((k) => k.trim()).filter((k) => k.length > 5);
      splitKeys.forEach((keyVal, idx) => {
        if (!this.settings.apiKeyPool!.keys.some((k) => k.key === keyVal)) {
          this.settings.apiKeyPool!.keys.push({
            id: `env_key_${idx + 1}`,
            name: `Environment Backup Key #${idx + 1}`,
            key: keyVal,
            maskedKey: maskApiKey(keyVal),
            status: 'ACTIVE',
            addedAt: new Date().toISOString(),
            successCount: 0,
            failureCount: 0,
            isSystemDefault: true,
          });
        }
      });
    }

    return this.settings.apiKeyPool;
  }

  public addApiKey(name: string, rawKey: string): GeminiKeyConfig {
    const pool = this.getApiKeyPool();
    const cleanKey = rawKey.trim();
    if (!cleanKey) {
      throw new Error('API key cannot be empty.');
    }

    // Check if key already exists
    const existing = pool.keys.find((k) => k.key === cleanKey);
    if (existing) {
      existing.status = 'ACTIVE';
      existing.lastError = undefined;
      return existing;
    }

    const newKeyConfig: GeminiKeyConfig = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || `API Key #${pool.keys.length + 1}`,
      key: cleanKey,
      maskedKey: maskApiKey(cleanKey),
      status: 'ACTIVE',
      addedAt: new Date().toISOString(),
      successCount: 0,
      failureCount: 0,
      isSystemDefault: false,
    };

    pool.keys.push(newKeyConfig);
    return newKeyConfig;
  }

  public removeApiKey(id: string): boolean {
    const pool = this.getApiKeyPool();
    const prevLen = pool.keys.length;
    pool.keys = pool.keys.filter((k) => k.id !== id);
    return pool.keys.length < prevLen;
  }

  public toggleApiKeyStatus(id: string, status?: ApiKeyStatus): GeminiKeyConfig | null {
    const pool = this.getApiKeyPool();
    const key = pool.keys.find((k) => k.id === id);
    if (!key) return null;
    if (status) {
      key.status = status;
    } else {
      key.status = key.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
    }
    return key;
  }

  public resetKeyQuota(id: string): GeminiKeyConfig | null {
    const pool = this.getApiKeyPool();
    const key = pool.keys.find((k) => k.id === id);
    if (!key) return null;
    key.status = 'ACTIVE';
    key.lastError = undefined;
    return key;
  }

  public resetAllKeysQuota(): void {
    const pool = this.getApiKeyPool();
    for (const key of pool.keys) {
      if (key.status === 'QUOTA_EXHAUSTED' || key.status === 'RATE_LIMITED') {
        key.status = 'ACTIVE';
        key.lastError = undefined;
      }
    }
  }

  public markKeyQuotaExhausted(keyStringOrId: string, errorMsg: string): void {
    const pool = this.getApiKeyPool();
    const target = pool.keys.find((k) => k.key === keyStringOrId || k.id === keyStringOrId);
    if (target) {
      target.status = 'QUOTA_EXHAUSTED';
      target.lastError = errorMsg;
      target.failureCount += 1;
      target.lastUsedAt = new Date().toISOString();

      // Find next active key to log rotation
      const nextKey = pool.keys.find((k) => k.status === 'ACTIVE' && k.id !== target.id);
      if (nextKey) {
        pool.lastRotationEvent = {
          fromKeyName: target.name,
          toKeyName: nextKey.name,
          reason: errorMsg,
          timestamp: new Date().toISOString(),
        };

        this.addNotification({
          title: '⚡ API Key Quota Rotated',
          message: `"${target.name}" reached quota limit. Automatically switched to "${nextKey.name}".`,
          type: 'SYSTEM',
        });
      } else {
        this.addNotification({
          title: '⚠️ All API Keys Quota Exhausted',
          message: `All keys in your pool have reached their rate or quota limit. Please add another Gemini API key in Key Manager.`,
          type: 'SYSTEM',
        });
      }
    }
  }

  public markKeySuccess(keyStringOrId: string): void {
    const pool = this.getApiKeyPool();
    const target = pool.keys.find((k) => k.key === keyStringOrId || k.id === keyStringOrId);
    if (target) {
      target.status = 'ACTIVE';
      target.successCount += 1;
      target.lastUsedAt = new Date().toISOString();
      target.lastError = undefined;
    }
  }

  // --- Agent & Background Tasks ---
  public getAgentStatus() {
    return {
      status: this.agentStatus,
      tasks: this.agentTasks,
      stats: {
        totalDiscovered: this.leads.length,
        researched: this.leads.filter((l) => l.websiteAudit !== undefined).length,
        messagesReady: this.leads.filter((l) => Boolean(l.generatedMessage)).length,
        conceptsBuilt: this.leads.filter((l) => Boolean(l.websiteConcept)).length,
        awaitingApproval: this.leads.filter((l) => l.status === 'PENDING_APPROVAL').length,
        contacted: this.leads.filter((l) => l.status === 'CONTACTED').length,
        replies: this.leads.filter((l) => ['REPLIED', 'INTERESTED', 'CALL_BOOKED'].includes(l.status)).length,
        won: this.leads.filter((l) => l.status === 'WON').length,
      },
    };
  }

  public setAgentStatus(status: 'IDLE' | 'RUNNING' | 'PAUSED') {
    this.agentStatus = status;
  }

  public addTask(taskData: Omit<AgentTask, 'id' | 'startedAt'>): AgentTask {
    const task: AgentTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      startedAt: new Date().toISOString(),
      ...taskData,
    };
    this.agentTasks.unshift(task);
    if (this.agentTasks.length > 50) {
      this.agentTasks = this.agentTasks.slice(0, 50);
    }
    return task;
  }

  public updateTask(id: string, updates: Partial<AgentTask>): AgentTask | null {
    const task = this.agentTasks.find((t) => t.id === id);
    if (!task) return null;
    Object.assign(task, updates);
    return task;
  }

  // --- Notifications ---
  public getNotifications(): AppNotification[] {
    return this.notifications;
  }

  public addNotification(n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): AppNotification {
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...n,
    };
    this.notifications.unshift(notif);
    return notif;
  }

  public markNotificationRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach((n) => (n.read = true));
  }

  // --- Analytics ---
  public getAnalytics(): AnalyticsMetrics {
    const totalLeads = this.leads.length;
    const newLeads = this.leads.filter((l) => l.status === 'NEW').length;
    const qualifiedLeads = this.leads.filter((l) => l.status !== 'NEW' && l.status !== 'LOST' && l.status !== 'DO_NOT_CONTACT').length;
    const hotLeads = this.leads.filter((l) => l.scoreBreakdown?.tier === 'HOT').length;
    const contactedCount = this.leads.filter((l) =>
      ['CONTACTED', 'REPLIED', 'INTERESTED', 'CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(l.status)
    ).length;
    const repliesCount = this.leads.filter((l) =>
      ['REPLIED', 'INTERESTED', 'CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(l.status)
    ).length;
    const interestedCount = this.leads.filter((l) =>
      ['INTERESTED', 'CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(l.status)
    ).length;
    const callsBookedCount = this.leads.filter((l) =>
      ['CALL_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(l.status)
    ).length;
    const proposalsSentCount = this.leads.filter((l) =>
      ['PROPOSAL_SENT', 'NEGOTIATION', 'WON'].includes(l.status)
    ).length;
    const wonCount = this.leads.filter((l) => l.status === 'WON').length;

    const conversionRate = totalLeads > 0 ? Number(((wonCount / totalLeads) * 100).toFixed(1)) : 0;
    const pipelineValue = this.leads
      .filter((l) => !['LOST', 'DO_NOT_CONTACT'].includes(l.status))
      .reduce((acc, curr) => acc + (curr.dealValue || curr.recommendedPrice || 450), 0);
    const realizedRevenue = this.leads
      .filter((l) => l.status === 'WON')
      .reduce((acc, curr) => acc + (curr.dealValue || curr.recommendedPrice || 450), 0);

    // Categories
    const catMap: Record<string, { count: number; value: number }> = {};
    this.leads.forEach((l) => {
      const cat = l.category || 'General';
      if (!catMap[cat]) catMap[cat] = { count: 0, value: 0 };
      catMap[cat].count += 1;
      catMap[cat].value += l.dealValue || 450;
    });
    const categoryDistribution = Object.entries(catMap).map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value,
    }));

    // Locations
    const locMap: Record<string, number> = {};
    this.leads.forEach((l) => {
      const city = l.city || 'Other';
      locMap[city] = (locMap[city] || 0) + 1;
    });
    const locationDistribution = Object.entries(locMap).map(([city, count]) => ({
      city,
      count,
    }));

    // Statuses
    const statusMap: Record<string, number> = {};
    this.leads.forEach((l) => {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status: status as PipelineStatus,
      count,
    }));

    // Funnel Steps
    const funnelSteps = [
      { step: 'Discovered', count: totalLeads, dropoffPercentage: 0 },
      {
        step: 'Qualified',
        count: qualifiedLeads,
        dropoffPercentage: totalLeads ? Math.round(((totalLeads - qualifiedLeads) / totalLeads) * 100) : 0,
      },
      {
        step: 'Contacted',
        count: contactedCount,
        dropoffPercentage: qualifiedLeads ? Math.round(((qualifiedLeads - contactedCount) / qualifiedLeads) * 100) : 0,
      },
      {
        step: 'Replies',
        count: repliesCount,
        dropoffPercentage: contactedCount ? Math.round(((contactedCount - repliesCount) / contactedCount) * 100) : 0,
      },
      {
        step: 'Interested / Calls',
        count: interestedCount + callsBookedCount,
        dropoffPercentage: repliesCount ? Math.round(((repliesCount - (interestedCount + callsBookedCount)) / repliesCount) * 100) : 0,
      },
      {
        step: 'Won Clients',
        count: wonCount,
        dropoffPercentage: proposalsSentCount ? Math.round(((proposalsSentCount - wonCount) / (proposalsSentCount || 1)) * 100) : 0,
      },
    ];

    return {
      totalLeads,
      newLeads,
      qualifiedLeads,
      hotLeads,
      contactedCount,
      repliesCount,
      interestedCount,
      callsBookedCount,
      proposalsSentCount,
      wonCount,
      conversionRate,
      pipelineValue,
      realizedRevenue,
      categoryDistribution,
      locationDistribution,
      statusDistribution,
      funnelSteps,
    };
  }
}

// Global singleton
const globalForAppStore = global as unknown as { appStore: AppStore | undefined };
export const appStore = globalForAppStore.appStore ?? new AppStore();
if (process.env.NODE_ENV !== 'production') globalForAppStore.appStore = appStore;
