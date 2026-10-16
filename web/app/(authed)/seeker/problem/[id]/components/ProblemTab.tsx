"use client";

import { Building2, UserCircle, Phone, Mail, Users, FileText } from "lucide-react";
import type { ProblemResponse } from "@/types/problem";

export function ProblemTab({ problem }: { problem: ProblemResponse }) {
  
  // 🚀 FORMATTING HELPER: Automatically converts stringified JSON arrays into clean bullet points.
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
      <div className="flex-1 w-full space-y-6">
        
        {/* Blueprint Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8">
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
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Technical Constraints</h3>
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 text-sm font-medium text-slate-700 leading-relaxed shadow-sm">
                  {formatTextContent(problem.constraints)}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Sub-problems Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h2 className="text-xl font-bold text-slate-900">AI-Decomposed Sub-problems</h2>
          </div>
          <div className="grid gap-4">
            {problem.subtasks.map((subtask, index) => (
              <div key={subtask.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="text-base font-bold text-slate-900">{subtask.title}</h3>
                      <span className="px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 text-[10px] uppercase tracking-wider font-bold rounded-md">
                        {subtask.departmentFocus}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{subtask.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attachments Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <h2 className="text-xl font-bold text-slate-900">Attachments</h2>
          </div>

          {problem.problemDocumentUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <svg className="w-10 h-10 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6zm2-8h5v2H8v-2zm0 4h8v2H8v-2z" />
                </svg>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Problem Specification Document</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">PDF Document</p>
                </div>
              </div>
              <a
                href={problem.problemDocumentUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-sm w-full sm:w-auto shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500 font-medium text-sm">No attachments uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDE: Organization Details Card ── */}
      <div className="w-full lg:w-80 shrink-0 sticky top-24">
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