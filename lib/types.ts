export interface UserAccount {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  businessName?: string;
  phone?: string;
  website?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PipelineStatus =
  | 'NEW'
  | 'DISCOVERED'
  | 'QUALIFIED'
  | 'AUDITED'
  | 'OUTREACH_READY'
  | 'RESEARCHING'
  | 'MESSAGE_READY'
  | 'PENDING_APPROVAL'
  | 'CONTACTED'
  | 'REPLIED'
  | 'IN_CONVERSATION'
  | 'OBJECTION_HANDLING'
  | 'INTERESTED'
  | 'CALL_BOOKED'
  | 'MEETING_REQUESTED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'FOLLOW_UP'
  | 'DO_NOT_CONTACT'
  | 'UNSUBSCRIBED'
  | 'BOUNCED'
  | 'INVALID_CONTACT'
  | 'CONTRACT_SENT'
  | 'DEPOSIT_REQUESTED'
  | 'DEPOSIT_RECEIVED'
  | 'PROJECT_ONBOARDING'
  | 'IN_DEVELOPMENT'
  | 'CLIENT_REVIEW'
  | 'FINAL_PAYMENT'
  | 'DELIVERED';

export type LeadTier = 'HOT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'WARM' | 'COLD';
export type LeadIntent = 'HIGH_INTENT' | 'MEDIUM_INTENT' | 'LOW_INTENT';

export type WebsiteStatus =
  | 'NO_WEBSITE'
  | 'OUTDATED'
  | 'OUTDATED_WEBSITE'
  | 'SLOW_WEBSITE'
  | 'POOR_MOBILE'
  | 'BROKEN'
  | 'BROKEN_WEBSITE'
  | 'SOCIAL_ONLY'
  | 'ONE_PAGE_WEBSITE'
  | 'NO_BOOKING_SYSTEM'
  | 'NO_LEAD_CAPTURE'
  | 'NO_WHATSAPP_CTA'
  | 'NO_ONLINE_ORDERING'
  | 'WEAK_SEO'
  | 'WEAK_CONVERSION'
  | 'COMPETITOR_GAP'
  | 'MODERATE'
  | 'GOOD';

export type OutreachChannel =
  | 'EMAIL'
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'PHONE';

export type ChannelStatus =
  | 'AVAILABLE_API'
  | 'DIRECT_API'
  | 'MANUAL_APPROVAL_REQUIRED'
  | 'WEB_INTENT'
  | 'APPROVED'
  | 'NOT_SUPPORTED';

export type VerificationStatus = 'VERIFIED' | 'LIKELY' | 'UNVERIFIED';

export interface ContactVerification {
  phoneStatus: VerificationStatus;
  emailStatus: VerificationStatus;
  addressStatus: VerificationStatus;
  websiteStatus: VerificationStatus;
  dedupHash?: string;
  sourceAttribution?: string;
}

export interface DigitalOpportunityProfile {
  websiteStatus: WebsiteStatus;
  mobileQuality: 'NONE' | 'BROKEN' | 'POOR' | 'ACCEPTABLE' | 'OPTIMIZED';
  speedEstimate: number; // 0-100
  seoQuality: 'CRITICAL' | 'POOR' | 'AVERAGE' | 'GOOD';
  conversionQuality: 'NON_EXISTENT' | 'HIGH_FRICTION' | 'MODERATE' | 'STREAMLINED';
  bookingCapability: boolean;
  whatsappCapability: boolean;
  onlineOrdering: boolean;
  socialPresence: 'STRONG' | 'MODERATE' | 'INACTIVE' | 'NONE';
  digitalGaps: string[];
  opportunityLevel: 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface CompetitorComparison {
  competitorName: string;
  websiteUrl?: string;
  hasModernWebsite: boolean;
  hasOnlineBooking: boolean;
  hasWhatsAppCTA: boolean;
  hasOnlineOrdering: boolean;
  googleRating?: number;
  reviewCount?: number;
  keyAdvantage: string;
}

export interface CompetitorGapAnalysis {
  competitorsFound: CompetitorComparison[];
  competitiveGapSummary: string;
  lostOpportunityEstimateMonthly: string;
  recommendedDifferentiators: string[];
}

export interface WebsiteAudit {
  score: number; // 0-100
  hasHttps: boolean;
  isMobileResponsive: boolean;
  pageSpeedEstimate: number; // 0-100
  designQuality: 'POOR' | 'AVERAGE' | 'MODERN';
  hasClearCTA: boolean;
  hasContactFunnel: boolean;
  seoBasicsScore: number; // 0-100
  problems: string[];
  opportunities: string[];
  redesignValue: 'LOW' | 'MEDIUM' | 'HIGH';
  lastAuditedAt: string;
  metricTypes?: Record<string, 'MEASURED' | 'ESTIMATED' | 'AI_INFERRED'>;
  executiveSummary?: string;
  businessImpact?: string;
  technicalQuality?: string;
  ctaQuality?: string;
  modernityScore?: number;
  suggestedFeatures?: string[];
  suggestedPackage?: 'STARTER' | 'PROFESSIONAL' | 'PREMIUM' | 'CUSTOM';
}

export interface DetailedScoringFactors {
  digitalNeedScore: number; // 0-25
  businessQualityScore: number; // 0-20
  revenuePotentialScore: number; // 0-15
  contactabilityScore: number; // 0-15
  buyingSignalsScore: number; // 0-15
  competitiveGapScore: number; // 0-10
}

export interface LeadScoreBreakdown {
  totalScore: number; // 0-100
  tier: LeadTier;
  intent?: LeadIntent;
  scoreFactors?: DetailedScoringFactors;
  factors: {
    name: string;
    points: number;
    maxPoints?: number;
    description: string;
  }[];
  reasoning: string;
}

export interface WebsiteConcept {
  id: string;
  previewId: string;
  leadId: string;
  version: number;
  createdAt: string;
  sitemap: string[];
  headline: string;
  subheadline: string;
  primaryCTA: string;
  secondaryCTA: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  serviceSections: {
    name: string;
    description: string;
    iconName?: string;
    priceStartingAt?: string;
  }[];
  socialProofSection: {
    title: string;
    highlightReviews: { reviewer: string; quote: string; rating: number }[];
  };
  contactSection: {
    address: string;
    phone: string;
    hours: string;
    whatsappPrompt: string;
  };
  bookingCTA: {
    title: string;
    description: string;
    buttonText: string;
  };
  seoMeta: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export type ProspectIntent =
  | 'PRICING_REQUEST'
  | 'INTERESTED'
  | 'SEND_DETAILS'
  | 'MEETING_REQUEST'
  | 'CALL_REQUEST'
  | 'TIMELINE_REQUEST'
  | 'OBJECTION_PRICE'
  | 'OBJECTION_NEED'
  | 'OBJECTION_EXISTING_DEVELOPER'
  | 'OBJECTION_TRUST'
  | 'OBJECTION_TIMING'
  | 'NOT_INTERESTED'
  | 'WRONG_CONTACT'
  | 'DO_NOT_CONTACT'
  | 'OTHER';

export interface ConversationMemoryEntry {
  id?: string;
  timestamp: string;
  sender: 'PROSPECT' | 'AGENCY' | 'DEVELOPER' | 'AI_COPILOT' | 'AGENT';
  channel: OutreachChannel;
  messageText: string;
  intent?: ProspectIntent;
  classifiedIntent?: string;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'SKEPTICAL' | 'NEGATIVE';
  objectionRaised?: string;
  buyingSignals?: string[];
  extractedFacts?: string[];
}

export interface LeadConversationMemory {
  leadId?: string;
  messages: ConversationMemoryEntry[];
  currentIntent?: ProspectIntent | string;
  keyFacts?: string[];
  previousObjections?: string[];
  objectionNotes?: string[];
  buyingSignals?: string[];
  extractedFacts?: string[];
  lastSuggestedResponse?: string;
  pricingDiscussed?: number;
  timelinePreferences?: string;
  requestedFeatures?: string[];
  lastReplyAt?: string;
  updatedAt?: string;
}

export type NextBestActionType =
  | 'RESEARCH_LEAD'
  | 'GENERATE_OUTREACH_MESSAGE'
  | 'BUILD_WEBSITE_CONCEPT'
  | 'SEND_INITIAL_OUTREACH'
  | 'WAIT'
  | 'SEND_FOLLOWUP'
  | 'SCHEDULE_FOLLOW_UP'
  | 'ANSWER_PRICING'
  | 'SEND_WEBSITE_CONCEPT'
  | 'HANDLE_OBJECTION'
  | 'REVIEW_REPLY_AND_RESPOND'
  | 'REQUEST_CALL'
  | 'SEND_PROPOSAL'
  | 'SEND_PROPOSAL_AGREEMENT'
  | 'FOLLOW_UP_PROPOSAL'
  | 'GENERATE_HANDOFF_PACKET'
  | 'INITIATE_ONBOARDING'
  | 'MARK_LOST'
  | 'STOP_CONTACT';

export interface NextBestAction {
  action: NextBestActionType;
  reason: string;
  reasoning?: string;
  dueDate: string;
  suggestedScript?: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface FollowUpStep {
  day: number; // e.g. 0, 3, 7, 14
  type: 'INITIAL' | 'QUICK_FOLLOWUP' | 'VALUE_ADD' | 'FINAL_CHECKIN';
  subject: string;
  body: string;
  channel: OutreachChannel;
  status: 'DRAFT' | 'APPROVED' | 'SENT' | 'SKIPPED';
  sentAt?: string;
  scheduledFor?: string;
}

export interface ProposalItem {
  feature: string;
  benefit: string;
}

export interface Proposal {
  id: string;
  leadId: string;
  businessName: string;
  title?: string;
  markdownContent?: string;
  clientContactName?: string;
  problemIdentified: string[];
  recommendedSolution: string;
  scopeFeatures: ProposalItem[];
  timelineWeeks: number;
  packageTier: 'STARTER' | 'PROFESSIONAL' | 'PREMIUM' | 'CUSTOM';
  totalPrice: number;
  currency: string;
  revisionPolicy: string;
  hostingAndDomainNote: string;
  maintenanceMonthlyOption?: number;
  callToAction: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  pdfExportAvailable: boolean;
}

export interface ProjectHandoffDeliverable {
  name: string;
  description: string;
  status: string;
}

export interface ProjectHandoffChecklistItem {
  item: string;
  received: boolean;
}

export interface ProjectHandoff {
  id: string;
  leadId: string;
  businessName: string;
  clientContactName?: string;
  clientContactEmail?: string;
  clientContactPhone?: string;
  tier?: 'STARTER' | 'PROFESSIONAL' | 'PREMIUM' | 'CUSTOM';
  selectedPackage?: string;
  agreedPrice?: number;
  totalContractValue: number;
  depositAmount: number;
  balanceDueOnLaunch?: number;
  depositPaid?: boolean;
  finalPaymentPaid?: boolean;
  targetLaunchDate?: string;
  technicalStack?: string[];
  deploymentTarget?: string;
  deliverables: ProjectHandoffDeliverable[];
  clientOnboardingChecklist: ProjectHandoffChecklistItem[];
  maintenanceRetainerOffer?: {
    monthlyFee: number;
    includedHours: number;
    details: string;
  };
  contractAgreementMarkdown: string;
  status: 'DEPOSIT_PENDING' | 'ONBOARDING' | 'IN_DEVELOPMENT' | 'CLIENT_REVIEW' | 'DELIVERED';
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  timestamp: string;
  date?: string;
  type:
    | 'DISCOVERED'
    | 'VERIFIED'
    | 'RESEARCHED'
    | 'AUDITED'
    | 'SCORED'
    | 'COMPETITOR_ANALYZED'
    | 'CONCEPT_GENERATED'
    | 'MESSAGE_GENERATED'
    | 'APPROVED'
    | 'CONTACTED'
    | 'REPLY_RECEIVED'
    | 'INTENT_CLASSIFIED'
    | 'OBJECTION_HANDLED'
    | 'STATUS_CHANGED'
    | 'PROPOSAL_CREATED'
    | 'DEAL_WON'
    | 'HANDOFF_CREATED'
    | 'NOTE_ADDED';
  title: string;
  details?: string;
}

export interface Lead {
  id: string;
  businessName: string;
  category: string;
  city: string;
  country: string;
  address?: string;
  websiteUrl?: string;
  websiteStatus: WebsiteStatus;
  phone?: string;
  email?: string;
  socials: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    googleMaps?: string;
  };
  description: string;
  googleRating?: number;
  googleReviewCount?: number;
  growthSignals: string[];
  estimatedSize: string; // e.g. "1-5 staff", "Solo owner"

  // Verification & Opportunity Profile
  verification?: ContactVerification;
  opportunityProfile?: DigitalOpportunityProfile;

  // Research, Audit & Competitors
  websiteAudit?: WebsiteAudit;
  competitorGap?: CompetitorGapAnalysis;
  websiteConcept?: WebsiteConcept;
  scoreBreakdown: LeadScoreBreakdown;
  painPoints: string[];
  recommendedService: string;
  recommendedPrice: number;

  // Pipeline & Deals
  status: PipelineStatus;
  primaryChannel: OutreachChannel;
  channelCompliance: ChannelStatus;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  replyDetected?: boolean;
  replySnippet?: string;
  dealValue: number;
  estimatedDealValue?: number;
  probability?: number; // 0-100%
  expectedCloseDate?: string;

  // Next Best Action
  nextBestAction?: NextBestAction;

  // Outreach & Follow-ups
  generatedSubject?: string;
  generatedMessage?: string;
  followUpSequence: FollowUpStep[];

  // Conversation Memory
  conversationMemory?: LeadConversationMemory;

  // Project Handoff
  projectHandoff?: ProjectHandoff;

  // Extras
  notes: string[];
  activities: LeadActivity[];
  proposals: Proposal[];
  discoveredAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  name: string;
  title: string; // e.g., "Full-Stack Web & Mobile Developer"
  portfolioUrl: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
  experienceYears: number;
  services: string[];
  techStack: string[];
  specialOffer: string;
  customPitchPrompt?: string;
  currency?: string;
}

export interface PricingTier {
  id: 'STARTER' | 'PROFESSIONAL' | 'PREMIUM';
  name: string;
  price: number;
  description: string;
  features: string[];
  turnaroundDays: number;
}

export interface ScoringWeights {
  noWebsite: number;
  outdatedWebsite: number;
  poorMobile: number;
  activeSocialPresence: number;
  growingBusiness: number;
  weakConversionFunnel: number;
  strongLocalDemand: number;
}

export interface AgentTask {
  id: string;
  type:
    | 'DISCOVER'
    | 'VERIFY'
    | 'RESEARCH'
    | 'AUDIT'
    | 'SCORE'
    | 'COMPETITOR'
    | 'CONCEPT'
    | 'OUTREACH_DRAFT'
    | 'FOLLOW_UP'
    | 'REPLY_PROCESS'
    | 'PROPOSAL';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'REQUIRES_HUMAN_ACTION';
  description: string;
  progress: number; // 0-100
  targetLeadId?: string;
  targetBusinessName?: string;
  resultSummary?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AgentActivityLog {
  id: string;
  timestamp: string;
  module:
    | 'DISCOVERY'
    | 'VERIFICATION'
    | 'AUDIT'
    | 'SCORING'
    | 'COMPETITOR'
    | 'CONCEPT'
    | 'OUTREACH'
    | 'REPLY'
    | 'COPILOT'
    | 'PROPOSAL'
    | 'HANDOFF'
    | 'SYSTEM';
  action: string;
  details: string;
  leadId?: string;
  leadName?: string;
}

export interface IntegrationConnector {
  id: string;
  name: string;
  type: OutreachChannel;
  status: 'CONNECTED' | 'DISCONNECTED' | 'REQUIRES_SETUP';
  complianceLevel: 'DIRECT_API' | 'MANUAL_APPROVAL_REQUIRED' | 'WEB_INTENT';
  description: string;
  details?: string;
}

export type ApiKeyStatus = 'ACTIVE' | 'QUOTA_EXHAUSTED' | 'RATE_LIMITED' | 'INVALID' | 'DISABLED';

export interface GeminiKeyConfig {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  status: ApiKeyStatus;
  addedAt: string;
  lastUsedAt?: string;
  lastError?: string;
  successCount: number;
  failureCount: number;
  isSystemDefault?: boolean;
}

export interface ApiKeyPoolSettings {
  keys: GeminiKeyConfig[];
  autoRotateOnQuota: boolean;
  activeKeyId?: string;
  lastRotationEvent?: {
    fromKeyName: string;
    toKeyName: string;
    reason: string;
    timestamp: string;
  };
}

export interface AppSettings {
  profile: BusinessProfile;
  pricingTiers: PricingTier[];
  scoringWeights: ScoringWeights;
  targetIndustries: string[];
  targetLocations: string[];
  dailyOutreachLimit: number;
  humanApprovalRequired: boolean;
  approvalMode?: 'MANUAL' | 'SEMI_AUTOMATIC' | 'AUTOMATIC';
  integrations: IntegrationConnector[];
  apiKeyPool?: ApiKeyPoolSettings;
  onboardingCompleted: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'HOT_LEAD' | 'REPLY' | 'INTERESTED' | 'CALL' | 'FOLLOWUP' | 'PROPOSAL' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  leadId?: string;
}

export interface AnalyticsMetrics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  contactedCount: number;
  repliesCount: number;
  interestedCount: number;
  callsBookedCount: number;
  proposalsSentCount: number;
  wonCount: number;
  conversionRate: number; // percentage
  pipelineValue: number;
  weightedPipelineValue?: number;
  realizedRevenue: number;
  averageDealValue?: number;
  categoryDistribution: { category: string; count: number; value: number }[];
  locationDistribution: { city: string; count: number }[];
  statusDistribution: { status: PipelineStatus; count: number }[];
  funnelSteps: { step: string; count: number; dropoffPercentage: number }[];
}
