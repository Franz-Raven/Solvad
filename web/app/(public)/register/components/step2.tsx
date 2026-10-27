"use client";

import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { programCategories } from "@/lib/data/programs";
import { cebuUniversities } from "@/lib/data/universities";

interface Step2Props {
  data: { firstName: string; lastName: string; university: string; course: string; skills: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
  isLoading: boolean;
  onUniversityChange: (value: string) => void;
  onCourseChange: (value: string) => void;
}

export default function Step2({ data, onChange, onSubmit, onBack, isLoading, onUniversityChange, onCourseChange }: Step2Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">First Name</label>
          <input
            id="firstName" name="firstName" type="text"
            value={data.firstName} onChange={onChange}
            className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            placeholder="Juan" required
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="lastName" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Last Name</label>
          <input
            id="lastName" name="lastName" type="text"
            value={data.lastName} onChange={onChange}
            className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            placeholder="Dela Cruz" required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="university" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Institution/University</label>
        <Select value={data.university} onValueChange={onUniversityChange}>
          <SelectTrigger className="w-full px-4 py-3.5 h-[50px] bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium">
            <SelectValue placeholder="Select your university" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-lg">
            {cebuUniversities.map((uni) => (
              <SelectItem key={uni} value={uni} className="focus:bg-emerald-50 focus:text-emerald-900 font-medium py-2.5 cursor-pointer">{uni}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="course" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Degree Program / Course</label>
        <Select value={data.course} onValueChange={onCourseChange}>
          <SelectTrigger className="w-full px-4 py-3.5 h-[50px] bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium">
            <SelectValue placeholder="Select your course" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-lg max-h-[300px]">
            {programCategories.map((cat) => (
              <SelectGroup key={cat.name}>
                <SelectLabel className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 py-2">{cat.name}</SelectLabel>
                {cat.programs.map((prog) => (
                  <SelectItem key={prog} value={prog} className="focus:bg-emerald-50 focus:text-emerald-900 font-medium py-2.5 cursor-pointer">{prog}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="skills" className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Skills & Interests <span className="normal-case font-medium">(Optional)</span></label>
        <input
          id="skills" name="skills" type="text"
          value={data.skills} onChange={onChange}
          className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
          placeholder="e.g. react, data science, agile (comma separated)"
        />
        <p className="text-[11px] font-medium text-slate-400 pl-1 mt-1">Used to power your automated problem recommendations.</p>
      </div>

      <div className="flex gap-3 pt-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            Back
          </button>
        )}
        <button
          type="submit" disabled={isLoading || !data.firstName || !data.lastName || !data.university || !data.course}
          className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
        </button>
      </div>
    </form>
  );
}