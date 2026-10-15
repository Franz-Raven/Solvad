import { BriefcaseBusiness, Building2, GraduationCap, Sparkles, User2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cebuUniversities } from "@/lib/data/universities";
import { programCategories } from "@/lib/data/programs";

interface SolverProfileFormProps {
  data: {
    firstName: string;
    lastName: string;
    institution: string;
    degreeProgram: string;
    skills: string;
  };
  onChange: (field: string, value: string) => void;
}

export function SolverProfileForm({ data, onChange }: SolverProfileFormProps) {
  const parsedSkills = data.skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="mb-8 flex items-center gap-4">
        {/* MATCHED SCREENSHOT STYLING: bg-emerald-50, border-emerald-100, text-emerald-600 */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm shrink-0">
          <BriefcaseBusiness className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Academic & Skill Profile</h3>
          <p className="text-sm font-medium text-slate-500">Keep this current so problem recommendations stay relevant.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            <User2 className="h-3.5 w-3.5 text-emerald-600" />
            First Name
          </label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            <User2 className="h-3.5 w-3.5 text-emerald-600" />
            Last Name
          </label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />
            Institution / University
          </label>
          <Select value={data.institution} onValueChange={(val) => onChange("institution", val)}>
            <SelectTrigger className="w-full px-4 py-3.5 h-[50px] bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium">
              <SelectValue placeholder="Select your university" />
            </SelectTrigger>
            
            <SelectContent 
              position="popper" 
              align="start"
              className="rounded-xl border-slate-200 shadow-lg max-h-[250px] w-[var(--radix-select-trigger-width)]"
            >
              {cebuUniversities.map((university) => (
                <SelectItem key={university} value={university} className="focus:bg-emerald-50 focus:text-emerald-900 font-medium py-2.5 cursor-pointer">
                  {university}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
            Degree Program
          </label>
          <Select value={data.degreeProgram} onValueChange={(val) => onChange("degreeProgram", val)}>
            <SelectTrigger className="w-full px-4 py-3.5 h-[50px] bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium">
              <SelectValue placeholder="Select your degree program" />
            </SelectTrigger>
            
            <SelectContent 
              position="popper" 
              align="start"
              className="rounded-xl border-slate-200 shadow-lg max-h-[250px] w-[var(--radix-select-trigger-width)]"
            >
              {programCategories.map((category) => (
                <div key={category.name}>
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80">
                    {category.name}
                  </div>
                  {category.programs.map((program) => (
                    <SelectItem key={program} value={program} className="focus:bg-emerald-50 focus:text-emerald-900 font-medium py-2 cursor-pointer">
                      {program}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Skills
          </label>
          <input
            type="text"
            value={data.skills}
            onChange={(e) => onChange("skills", e.target.value)}
            placeholder="Java, Python, React, SQL"
            className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
          />
          <p className="pl-1 mt-1.5 text-[11px] font-medium text-slate-400">
            Add comma-separated keywords to improve matching quality.
          </p>

          {parsedSkills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {parsedSkills.map((skill) => (
                <span key={skill} className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm animate-in zoom-in-95 duration-200">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}