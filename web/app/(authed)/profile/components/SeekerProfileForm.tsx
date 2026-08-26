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
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
          <Users2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Organization details</h3>
          <p className="text-sm text-slate-500">This helps solvers identify and contact your team.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Building2 className="h-4 w-4 text-slate-400" />
            Organization Name
          </label>
          <input
            type="text"
            value={data.organizationName}
            onChange={(e) => onChange("organizationName", e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <User2 className="h-4 w-4 text-slate-400" />
              Contact Person
            </label>
            <input
              type="text"
              value={data.contactPerson}
              onChange={(e) => onChange("contactPerson", e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Phone className="h-4 w-4 text-slate-400" />
              Contact Number
            </label>
            <input
              type="tel"
              value={data.contactNumber}
              onChange={(e) => onChange("contactNumber", e.target.value)}
              placeholder="+63 912 345 6789"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </div>
      </div>
    </div>
  );
}