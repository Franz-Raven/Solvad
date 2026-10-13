import { Building2, Phone, User2, Users2 } from "lucide-react";

interface SeekerProfileFormProps {
  data: {
    organizationName: string;
    contactPerson: string;
    contactNumber: string;
  };
  onChange: (field: string, value: string) => void;
}

export function SeekerProfileForm({ data, onChange }: SeekerProfileFormProps) {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="mb-8 flex items-center gap-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-[0_4px_14px_rgba(16,185,129,0.3)] shrink-0">
          <Users2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Organization Details</h3>
          <p className="text-sm font-medium text-slate-500">This helps solvers identify and contact your team.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />
            Organization Name
          </label>
          <input
            type="text"
            value={data.organizationName}
            onChange={(e) => onChange("organizationName", e.target.value)}
            className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              <User2 className="h-3.5 w-3.5 text-emerald-600" />
              Contact Person
            </label>
            <input
              type="text"
              value={data.contactPerson}
              onChange={(e) => onChange("contactPerson", e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              Contact Number
            </label>
            <input
              type="tel"
              value={data.contactNumber}
              onChange={(e) => onChange("contactNumber", e.target.value)}
              placeholder="+63 912 345 6789"
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-slate-900 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}