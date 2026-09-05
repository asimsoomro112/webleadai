'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Monitor,
  Tablet,
} from 'lucide-react';
import { WebsiteConcept } from '@/lib/types';

export default function ConceptPreviewPage() {
  const params = useParams();
  const previewId = params?.previewId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    lead: any;
    concept: WebsiteConcept;
    developer: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'meta'>('preview');

  useEffect(() => {
    async function loadConcept() {
      try {
        setLoading(true);
        const res = await fetch(`/api/concept/${previewId}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Concept not found');
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load concept');
      } finally {
        setLoading(false);
      }
    }
    if (previewId) {
      loadConcept();
    }
  }, [previewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Rendering Live Website Concept...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Concept Mockup Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">{error || 'This preview link may have expired or was not yet generated.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { lead, concept, developer } = data;
  const whatsappUrl = `https://wa.me/${lead.phone?.replace(/[^0-9]/g, '') || developer.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${lead.businessName}, I would like to inquire regarding reservations and orders.`)}`;
  const claimWebsiteUrl = `https://wa.me/${developer.whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${developer.name}, I love the website concept for ${lead.businessName}! I want to discuss launching it.`)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Banner for Client Presentation */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Return to Pipeline"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Interactive Live Concept
                </span>
                <span className="text-xs text-slate-400">for</span>
                <span className="text-sm font-bold text-white">{lead.businessName}</span>
              </div>
              <p className="text-xs text-slate-400">
                Crafted by {developer.name} ({developer.title})
              </p>
            </div>
          </div>

          {/* Device Frame View Switcher */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex items-center gap-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Desktop</span>
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tablet View"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Tablet</span>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mobile</span>
              </button>
            </div>

            <a
              href={claimWebsiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Claim & Launch This Site
            </a>
          </div>
        </div>
      </header>

      {/* Frame Container */}
      <main className="flex-1 flex justify-center p-2 sm:p-6 overflow-x-hidden">
        <div
          className={`transition-all duration-300 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            viewMode === 'mobile'
              ? 'max-w-[390px] border-slate-700'
              : viewMode === 'tablet'
              ? 'max-w-[768px]'
              : 'max-w-6xl'
          }`}
        >
          {/* Simulated Browser Address Bar */}
          <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 max-w-sm mx-4 bg-slate-900 border border-slate-800 rounded-md px-3 py-1 flex items-center justify-center gap-1.5 text-slate-300 text-xs truncate">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">https://{lead.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.pk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">Next.js 15</span>
            </div>
          </div>

          {/* Live Mockup Website Body */}
          <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto">
            {/* Mock Navigation Bar */}
            <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-20">
              <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-sm font-black">
                  {lead.businessName.charAt(0)}
                </span>
                <span>{lead.businessName}</span>
              </div>
              <div className="hidden sm:flex items-center gap-5 text-xs font-medium text-slate-300">
                {(concept.sitemap || []).slice(0, 4).map((page, idx) => (
                  <span key={idx} className="hover:text-white cursor-pointer transition-colors">
                    {page}
                  </span>
                ))}
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </nav>

            {/* Hero Section */}
            <section className="relative px-6 py-16 sm:py-24 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
              <div className="max-w-3xl mx-auto relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
                  <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>
                    {lead.googleRating}★ Rated by {lead.googleReviewCount}+ locals in {lead.city}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-6">
                  {concept.headline}
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8 font-normal">
                  {concept.subheadline}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {concept.primaryCTA}
                  </a>

                  <a
                    href="#menu"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition-all"
                  >
                    {concept.secondaryCTA}
                  </a>
                </div>
              </div>
            </section>

            {/* Services / Menu Offerings */}
            <section id="menu" className="px-6 py-12 bg-slate-900/40 border-y border-slate-800/80">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Featured Offerings</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Our Signature Specials</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(concept.serviceSections || []).map((sec, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                          <Flame className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-base mb-1.5">{sec.name}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{sec.description}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-400">{sec.priceStartingAt}</span>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-white flex items-center gap-1 font-medium"
                        >
                          Order <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Social Proof & Reviews */}
            <section className="px-6 py-14">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-white">{concept.socialProofSection?.title || 'What Customers Say'}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(concept.socialProofSection?.highlightReviews || []).map((rev, idx) => (
                    <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-center gap-1 text-amber-400 mb-3">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs text-slate-300 italic mb-4 leading-relaxed">&ldquo;{rev.quote}&rdquo;</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                          {rev.reviewer.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-white">{rev.reviewer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Direct Booking & WhatsApp CTA Banner */}
            <section className="px-6 py-12 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border-t border-slate-800 text-center">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{concept.bookingCTA?.title}</h2>
                <p className="text-xs sm:text-sm text-slate-300 mb-6">{concept.bookingCTA?.description}</p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  {concept.bookingCTA?.buttonText}
                </a>
              </div>
            </section>

            {/* Location and Footer */}
            <footer className="px-6 py-10 bg-slate-950 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div>
                  <h4 className="font-bold text-white mb-2">{lead.businessName}</h4>
                  <p className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{concept.contactSection?.address || `${lead.city}, ${lead.country}`}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{concept.contactSection?.phone || lead.phone || 'Direct line'}</span>
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Operating Hours</h4>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{concept.contactSection?.hours || 'Mon-Sun: Open Daily'}</span>
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-2">Direct Message</h4>
                  <p className="text-slate-400 mb-2">{concept.contactSection?.whatsappPrompt}</p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Open WhatsApp Chat &rarr;
                  </a>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
                <p>&copy; {new Date().getFullYear()} {lead.businessName}. All rights reserved.</p>
                <div className="flex items-center gap-2">
                  <span>Custom Architecture by</span>
                  <a
                    href={developer.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white font-medium underline"
                  >
                    {developer.name}
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Call-To-Action for the Client */}
      <aside className="sticky bottom-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Love this layout for {lead.businessName}?</p>
              <p className="text-[11px] text-slate-400">
                Turn this concept into your official website with your domain & WhatsApp order routing in 5 days.
              </p>
            </div>
          </div>
          <a
            href={claimWebsiteUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Launch With Muhammad Asim
          </a>
        </div>
      </aside>
    </div>
  );
}
