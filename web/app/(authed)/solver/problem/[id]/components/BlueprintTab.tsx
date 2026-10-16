"use client";

import { Building2, UserCircle, Phone, Mail, Users, FileText, Info } from "lucide-react";
import type { ProblemResponse } from "@/types/problem";

export function BlueprintTab({ problem }: { problem: ProblemResponse }) {
  
  // 🚀 FORMATTING HELPER: Automatically detects stringified JSON arrays like ["A", "B"] 
  // and converts them into clean bullet points. Fallbacks to normal text if not an array.
  const formatTextContent = (text: string | undefined) => {
    if (!text) return null;
    try {
      if (text.trim().startsWith("[") && text.trim().endsWith("]")) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return (
            <ul className="list-disc pl-5 space-y-2 marker:text-slate-400">
              {parsed.map((item, idx) => (
                <li key={idx} className="pl-1 leading-relaxed">{item}</li>
              ))}
            </ul>
          );
        }
      }
    } catch (e) {
      // Failsafe: Just return normal text if JSON.parse fails
    }
    return <div className="whitespace-pre-wrap">{text}</div>;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start animate-in fade-in duration-300">
      
      {/* ── LEFT SIDE: Main Blueprint Content ── */}
      <div className="flex-1 w-full bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold text-slate-900">Problem Blueprint</h2>
        </div>
        
        <div className="space-y-8">
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Background Context</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium text-slate-700 leading-relaxed shadow-sm">
              {formatTextContent(problem.backgroundContext)}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Primary Problem Statement</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-900 leading-relaxed shadow-sm">
              {formatTextContent(problem.primaryStatement)}
            </div>
          </section>

          {problem.objectives && (
            <section>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Objectives</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium text-slate-700 leading-relaxed shadow-sm">
                {formatTextContent(problem.objectives)}
              </div>
            </section>
          )}

          {problem.constraints && (
            <section>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Constraints & Limitations</h3>
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 text-sm font-medium text-slate-700 leading-relaxed shadow-sm">
                {formatTextContent(problem.constraints)}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDE: Organization Details Card ── */}
      <div className="w-full lg:w-80 shrink-0 sticky top-24 flex flex-col gap-4">
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6">
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Organization Details</h3>
              <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5">
                Contact and identity verification.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Org Name */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 pl-1">
                <Building2 className="w-3.5 h-3.5" /> Organization Name
              </label>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                {problem.seekerProfileUrl ? (
                  <img src={problem.seekerProfileUrl} alt="logo" className="w-6 h-6 rounded-full object-cover shrink-0 shadow-sm" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-400 shrink-0" />
                )}
                <span className="text-sm font-bold text-slate-900 truncate">
                  {problem.organizationName || "Industry Partner"}
                </span>
              </div>
            </div>

            {/* Contact Person */}
            {problem.contactPerson && (
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                  <UserCircle className="w-3.5 h-3.5" /> Contact Person
                </label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 shadow-sm truncate">
                  {problem.contactPerson}
                </div>
              </div>
            )}

            {/* Contact Number */}
            {problem.contactNumber && (
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                  <Phone className="w-3.5 h-3.5" /> Contact Number
                </label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 shadow-sm truncate">
                  {problem.contactNumber}
                </div>
              </div>
            )}

            {/* Email Address */}
            {problem.seekerEmail && (
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 shadow-sm truncate">
                  {problem.seekerEmail}
                </div>
              </div>
            )}
          </div>
        </div>

     

      </div>
    </div>
  );
}