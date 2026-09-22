import IndustryFormHeader from "./components/IndustryFormHeader";
import AddIndustryForm from "./components/AddIndustryForm";

export default function AddIndustryPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="w-full max-w-3xl">
        <IndustryFormHeader />
        <AddIndustryForm />
      </div>
    </div>
  );
}