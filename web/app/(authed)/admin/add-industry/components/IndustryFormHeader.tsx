import { Building2 } from "lucide-react";

export default function IndustryFormHeader() {
  return (
    <div className="text-center mb-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-white mb-4 shadow-lg shadow-accent/20">
        <Building2 className="w-8 h-8" strokeWidth={2} />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Add Industry Partner
      </h1>
      <p className="text-slate-500 font-medium">
        Create a new enterprise account for an industry partner (Seeker).
      </p>
    </div>
  );
}