import { Building2, Phone, User2, Users2, ChevronDown } from "lucide-react";
import { phoneCodes } from "@/lib/data/phoneCodes";

interface SeekerProfileFormProps {
  data: {
    organizationName: string;
    contactPerson: string;
    contactNumber: string;
  };
  onChange: (field: string, value: string) => void;
}

export function SeekerProfileForm({ data, onChange }: SeekerProfileFormProps) {
  
  // Extract dial code and local number from the combined saved string
  const activeDialCode = phoneCodes.find(c => data.contactNumber?.startsWith(c.dialCode))?.dialCode || "+63";
  const activeLocalNumber = data.contactNumber ? data.contactNumber.replace(activeDialCode, "").trim() : "";

  // Handle Country Code dropdown changes
  const handleDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    onChange("contactNumber", `${newCode} ${activeLocalNumber}`);
  };

  // Handle Phone Number typing with auto-formatting
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Strip all non-digit characters (letters, symbols, etc.)
    const rawDigits = e.target.value.replace(/\D/g, "");
    
    // 2. Format with spaces automatically (Safely handles up to 15 local digits)
    let formatted = rawDigits;
    if (rawDigits.length > 3 && rawDigits.length <= 6) {
      formatted = `${rawDigits.slice(0, 3)} ${rawDigits.slice(3)}`;
    } else if (rawDigits.length > 6 && rawDigits.length <= 10) {
      formatted = `${rawDigits.slice(0, 3)} ${rawDigits.slice(3, 6)} ${rawDigits.slice(6)}`;
    } else if (rawDigits.length > 10) {
      formatted = `${rawDigits.slice(0, 3)} ${rawDigits.slice(3, 6)} ${rawDigits.slice(6, 10)} ${rawDigits.slice(10, 15)}`;
    }
    
    // 3. Combine and save
    onChange("contactNumber", `${activeDialCode} ${formatted.trim()}`);
  };

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="mb-8 flex items-center gap-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.12)] shrink-0">
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
            
            {/* 🚀 COMBINED COUNTRY SELECTOR & AUTO-FORMATTING INPUT */}
            <div className="group flex items-center bg-slate-50/50 border border-slate-200 rounded-xl focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all overflow-hidden h-[50px]">
              
              {/* 🚀 FIXED: Added min-w-[110px] and shrink-0 to prevent cutoff */}
              <div className="relative flex items-center border-r border-slate-200 bg-slate-100/50 hover:bg-slate-100 transition-colors h-full shrink-0 min-w-[110px]">
                <select
                  value={activeDialCode}
                  onChange={handleDialCodeChange}
                  className="appearance-none bg-transparent pl-4 pr-8 focus:outline-none text-slate-700 font-bold text-sm cursor-pointer w-full h-full"
                >
                  {phoneCodes.map((country) => (
                    <option key={country.code} value={country.dialCode}>
                      {country.code} ({country.dialCode})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
              </div>

              {/* Formatted Number Input */}
              <input
                type="tel"
                value={activeLocalNumber}
                onChange={handleNumberChange}
                placeholder="912 345 6789"
                className="w-full h-full px-4 bg-transparent focus:outline-none text-slate-900 font-medium placeholder:text-slate-400"
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}