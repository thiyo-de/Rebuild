import React, { useState, useMemo } from 'react';
import { DailyLogEntry } from '../types';
import { getMetacognitiveMirrorForReason, HUBERMAN_EXECUTION_LAWS } from '../data/neuroscienceData';
import { triggerHaptic } from '../services/native';

interface TheoreticalFoundationViewProps {
  dailyLogs: DailyLogEntry[];
}

const ZERO_FRICTION_MESSAGE = "Zero Friction Detected";

export const TheoreticalFoundationView: React.FC<TheoreticalFoundationViewProps> = ({ dailyLogs }) => {
  const [expandedLaw, setExpandedLaw] = useState<string | null>(null);

  // Compute top 3 dominant failure reasons (last 30 days)
  const dominantFailureReasons = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const recentLogs = dailyLogs.filter((l) => l.date >= cutoffStr);

    const totalMissedCount = recentLogs.filter((l) => !l.completed).length;
    
    const reasonCounts: Record<string, number> = {};
    recentLogs.filter((l) => !l.completed && l.failureReason).forEach((l) => {
      const r = l.failureReason!;
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    });

    const sortedReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count, percentage: totalMissedCount > 0 ? Math.round((count / totalMissedCount) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
      
    return sortedReasons.slice(0, 3);
  }, [dailyLogs]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="flex items-center justify-between bg-[#0C101D] p-4 sm:p-5 rounded-3xl border border-white/[0.08] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <i className="ri-book-open-line text-xl" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Theoretical Foundation
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Neuroscience architecture &amp; cognitive mapping
            </p>
          </div>
        </div>
      </div>

      {/* NEUROSCIENCE METACOGNITIVE MIRROR COMPONENT */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <i className="ri-brain-line text-base" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Anterior Cingulate Error Diagnostics
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              Neuroscience Metacognitive Mirror
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Converts raw Error-Related Negativity (ERN) into structured biological root-cause identification and actionable protocol intervention. (Last 30 Days)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {dominantFailureReasons.length} Dominant Patterns Detected
            </span>
          </div>
        </div>

        {/* Dynamic Cards or Positive Confirmation */}
        {dominantFailureReasons.length > 0 ? (
          <div className="space-y-4 pt-1">
            {dominantFailureReasons.map((item, idx) => {
              const mirror = getMetacognitiveMirrorForReason(item.reason);
              return (
                <div
                  key={item.reason}
                  className="bg-[#080C16] rounded-2xl p-4 sm:p-5 border border-white/[0.08] shadow-xl space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-500/30 shrink-0">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">
                        Pattern observed: {item.reason}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                        Law: {mirror.sourceLaw}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {item.count} misses ({item.percentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-[#0B0F1B] rounded-xl p-3.5 border border-white/[0.06] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                        <i className="ri-dna-line text-sm" />
                        <span>Biological Root Cause:</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {mirror.biologicalPattern}
                      </p>
                    </div>

                    <div className="bg-[#0B0F1B] rounded-xl p-3.5 border border-white/[0.06] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <i className="ri-flashlight-line text-sm" />
                        <span>Actionable Protocol:</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {mirror.neuroscienceProtocol}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#080C16] rounded-2xl p-5 sm:p-6 border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <i className="ri-brain-line text-xl" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-emerald-400">
                  {ZERO_FRICTION_MESSAGE}
                </h4>
                <p className="text-[11px] font-bold text-slate-400">
                  High-Agency Executive Regulation Confirmed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-[#0B0F1B] rounded-xl p-3.5 border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <i className="ri-dna-line text-sm" />
                  <span>Biological Root Cause:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Anterior Midcingulate Cortex and prefrontal cortex maintained continuous executive command over limbic impulses. Baseline dopamine tone and circadian rhythm sustained.
                </p>
              </div>

              <div className="bg-[#0B0F1B] rounded-xl p-3.5 border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <i className="ri-flashlight-line text-sm" />
                  <span>Actionable Protocol:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Maintain the morning outdoor light anchor, 60-75 minute monotasked study bouts, and non-negotiable 11:00 PM sleep boundary to cement long-term identity remodeling.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODULE 1: THE DOPAMINE ECONOMY */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <i className="ri-shield-flash-line text-base" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
            The Dopamine Economy
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#080C16] rounded-2xl p-4 sm:p-5 border border-rose-500/20">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <i className="ri-close-circle-line text-rose-400" />
              Candy (Short-Form / Porn)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Provides pure novelty with zero memory or learning. Spikes dopamine instantly without limbic friction, causing massive receptor down-regulation. The baseline crash makes effortful tasks feel impossible.
            </p>
          </div>
          
          <div className="bg-[#080C16] rounded-2xl p-4 sm:p-5 border border-emerald-500/20">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <i className="ri-checkbox-circle-line text-emerald-400" />
              Food (Deep Work / Connection)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Builds story, empathy, and memory. Requires overcoming limbic friction (the amygdala) via the Prefrontal Cortex. Elevates the baseline dopamine tone long-term, compounding fluid intelligence.
            </p>
          </div>
        </div>
      </div>

      {/* MODULE 2: THE ATTENTION TAX */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <i className="ri-focus-3-line text-base" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            The Attention Tax
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          <div className="flex-1 w-full space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Monotasking</span>
                <span className="text-emerald-400">17s</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '41%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Fast-Switching (Multitasking)</span>
                <span className="text-rose-400">41s</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full w-full" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full bg-[#080C16] p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-white mb-1">The Visible Phone</h4>
            <p className="text-xs text-slate-400">
              A visible phone — even dead and face-down — measurably drops your attention and fluid intelligence. Your brain constantly spends energy inhibiting the urge to check it.
            </p>
          </div>
        </div>
      </div>

      {/* MODULE 3: THE 10-YEAR ARC */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <i className="ri-route-line text-base" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            The 10-Year Arc (Autonomic Modulation)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#080C16] rounded-2xl p-4 border border-rose-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl" />
            <span className="text-xs font-bold text-rose-400 block mb-1">Years 0 - 3</span>
            <h4 className="text-lg font-bold text-white mb-2">Push</h4>
            <p className="text-[11px] text-slate-400">
              Go all in. Find your edge. You cannot know how far it goes without three years of near-extreme effort.
            </p>
          </div>

          <div className="bg-[#080C16] rounded-2xl p-4 border border-amber-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl" />
            <span className="text-xs font-bold text-amber-400 block mb-1">Years 4 - 6</span>
            <h4 className="text-lg font-bold text-white mb-2">Regulate</h4>
            <p className="text-[11px] text-slate-400">
              Where people who never learned to come down start breaking. Install the brake here. Mandatory macro breaks.
            </p>
          </div>

          <div className="bg-[#080C16] rounded-2xl p-4 border border-cyan-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl" />
            <span className="text-xs font-bold text-cyan-400 block mb-1">Years 7+</span>
            <h4 className="text-lg font-bold text-white mb-2">Pro</h4>
            <p className="text-[11px] text-slate-400">
              You know your states. Fewer, harder reps. At the top sits something unexpected: playfulness. The security of having won.
            </p>
          </div>
        </div>
      </div>

      {/* HUBERMAN EXECUTION LAWS CARD (Collapsible Quick-Reference) */}
      <div className="bg-[#0C101D] rounded-3xl p-5 sm:p-7 border border-white/[0.08] shadow-2xl space-y-5">
        <div className="border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <i className="ri-shield-star-line text-base" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Theoretical Foundation
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
            Huberman's Four Execution Laws
          </h3>
          <p className="text-xs text-slate-400">
            Source: Andrew Huberman, Stanford Neuroscientist. The neurological architecture governing human stamina, dopamine thresholds, and stress adaptation.
          </p>
        </div>

        {/* 4 Accordion Cards with >=44px touch targets */}
        <div className="space-y-3.5">
          {HUBERMAN_EXECUTION_LAWS.map((law) => {
            const isExpanded = expandedLaw === law.id;

            return (
              <div
                key={law.id}
                className="bg-[#080C16] rounded-2xl border border-white/[0.08] overflow-hidden transition-all shadow-md"
              >
                {/* Header Trigger */}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setExpandedLaw(isExpanded ? null : law.id);
                  }}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer min-h-[48px] hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                      {law.id === 'the_rhythm' && <i className="ri-sun-line text-lg" />}
                      {law.id === 'the_off_switch' && <i className="ri-moon-clear-line text-lg" />}
                      {law.id === 'the_arc' && <i className="ri-compass-3-line text-lg" />}
                      {law.id === 'the_fighter' && <i className="ri-sword-line text-lg" />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">
                        {law.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {law.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 shrink-0">
                    <i
                      className={`ri-arrow-down-s-line text-lg transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.06] space-y-4">
                    {/* Mechanism */}
                    <div className="bg-[#0B0F1B] rounded-xl p-3.5 border border-white/[0.06] mt-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                        Neuroscience Mechanism
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {law.neuroscienceMechanism}
                      </p>
                    </div>

                    {/* Protocols Grid */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Actionable Protocols
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {law.protocols.map((proto) => (
                          <div
                            key={proto.title}
                            className="bg-[#0B0F1B] rounded-xl p-3 border border-white/[0.06] space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-white">{proto.title}</span>
                              {proto.timing && (
                                <span className="text-[11px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                  {proto.timing}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                              {proto.description}
                            </p>
                            <span className="text-[11px] font-bold text-emerald-400 block pt-0.5">
                              Impact: {proto.impact}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actionable Takeaway Quote */}
                    <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3.5 flex items-start gap-2.5">
                      <i className="ri-double-quotes-l text-indigo-400 text-lg shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                        {law.actionableTakeaway}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
