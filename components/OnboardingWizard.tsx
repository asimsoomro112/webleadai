'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  Bot,
  MapPin,
  Briefcase,
  DollarSign,
  Phone,
} from 'lucide-react';
import { AppSettings } from '@/lib/types';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (settings: Partial<AppSettings>) => void;
  onRunFirstDiscovery: (category: string, city: string) => void;
}

export function OnboardingWizard({
  isOpen,
  onClose,
  onComplete,
  onRunFirstDiscovery,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Alex Morgan');
  const [whatsapp, setWhatsapp] = useState('+923001234567');
  const [targetCategory, setTargetCategory] = useState('Restaurants');
  const [targetCity, setTargetCity] = useState('Karachi');
  const [starterPrice, setStarterPrice] = useState(199);
  const [proPrice, setProPrice] = useState(499);

  if (!isOpen) return null;

  const handleFinish = () => {
    onComplete({
      profile: {
        name,
        title: 'Full-Stack Web Developer & Conversion Specialist',
        portfolioUrl: 'https://github.com/developer',
        whatsapp: whatsapp,
        phone: whatsapp,
        email: 'dev@weblead.agency',
        location: `${targetCity}`,
        experienceYears: 4,
        services: ['Landing Pages', 'Business Web Apps', 'Mobile Optimization'],
        techStack: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript'],
        specialOffer: 'Compliant mobile-first overhaul with 7-day turnaround',
      },
    });
    onRunFirstDiscovery(targetCategory, targetCity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="onboarding-wizard-modal"
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                WebLead AI Quick Setup
              </h3>
              <span className="text-[11px] text-zinc-500">Step {step} of 3</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1 text-xs">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Welcome to Autonomous Web Client Acquisition
                </h4>
                <p className="text-zinc-500 mt-1">
                  Let&apos;s configure your developer profile so AI pitches cite your real experience and WhatsApp contact.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Your Name or Agency Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    WhatsApp Phone Number (For 1-click pitches)
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Select Your First Target Market
                </h4>
                <p className="text-zinc-500 mt-1">
                  Choose which business sector and city to target first.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Industry
                  </label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Restaurants">Restaurants & Cafes</option>
                    <option value="Dental Clinics">Dental & Medical Clinics</option>
                    <option value="Salons & Spas">Salons & Spas</option>
                    <option value="Gyms & Fitness Centers">Gyms & Fitness Centers</option>
                    <option value="Real Estate Agencies">Real Estate Agencies</option>
                    <option value="Auto Repair Workshops">Auto Repair Workshops</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Ready to Launch First Discovery!
                </h4>
                <p className="text-zinc-500 mt-1">
                  The AI agent will search Google, audit local {targetCategory} in {targetCity}, calculate scores, and generate ready-to-send messages.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready Parameters:</span>
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div>• Industry: {targetCategory}</div>
                  <div>• City: {targetCity}</div>
                  <div>• Sender: {name} ({whatsapp})</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Live Discovery</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
