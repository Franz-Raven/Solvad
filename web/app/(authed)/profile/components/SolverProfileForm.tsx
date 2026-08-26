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
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
          <BriefcaseBusiness className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Academic and skill profile</h3>
          <p className="text-sm text-slate-500">Keep this current so problem recommendations stay relevant.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <User2 className="h-4 w-4 text-slate-400" />
            First Name
          </label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <User2 className="h-4 w-4 text-slate-400" />
            Last Name
          </label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Building2 className="h-4 w-4 text-slate-400" />
            Institution / University
          </label>
          <Select value={data.institution} onValueChange={(val) => onChange("institution", val)}>
            <SelectTrigger className="!h-auto w-full rounded-2xl border-slate-300 px-4 py-3">
              <SelectValue placeholder="Select your university" />
            </SelectTrigger>
            <SelectContent>
              {cebuUniversities.map((university) => (
                <SelectItem key={university} value={university}>
                  {university}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            Degree Program
          </label>
          <Select value={data.degreeProgram} onValueChange={(val) => onChange("degreeProgram", val)}>
            <SelectTrigger className="!h-auto w-full rounded-2xl border-slate-300 px-4 py-3">
              <SelectValue placeholder="Select your degree program" />
            </SelectTrigger>
            <SelectContent>
              {programCategories.map((category) => (
                <div key={category.name}>
                  {category.programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Sparkles className="h-4 w-4 text-slate-400" />
            Skills
          </label>
          <input
            type="text"
            value={data.skills}
            onChange={(e) => onChange("skills", e.target.value)}
            placeholder="Java, Python, React, SQL"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <p className="mt-2 text-sm text-slate-500">
            Add comma-separated keywords to improve matching quality.
          </p>

          {parsedSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedSkills.map((skill) => (
                <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
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