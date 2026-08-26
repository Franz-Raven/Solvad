import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { programCategories } from "@/lib/data/programs";
import { cebuUniversities } from "@/lib/data/universities";

interface Step2Props {
  data: {
    firstName: string;
    lastName: string;
    university: string;
    course: string;
    skills: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
  onUniversityChange: (value: string) => void;
  onCourseChange: (value: string) => void;
}

export default function Step2({ data, onChange, onSubmit, onBack, isLoading, onUniversityChange, onCourseChange }: Step2Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-foreground"
        >
          First Name
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={data.firstName}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
          placeholder="Juan"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-foreground"
        >
          Last Name
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={data.lastName}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
          placeholder="Dela Cruz"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="university"
          className="block text-sm font-medium text-foreground"
        >
          Institution/University
        </label>
        <Select value={data.university} onValueChange={onUniversityChange}>
          <SelectTrigger className="w-full px-4 py-3 !h-auto rounded-lg border border-border bg-background text-foreground">
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

      <div className="space-y-2">
        <label
          htmlFor="course"
          className="block text-sm font-medium text-foreground"
        >
          Degree Program / Course
        </label>
        <Select value={data.course} onValueChange={onCourseChange}>
          <SelectTrigger className="w-full px-4 py-3 !h-auto rounded-lg border border-border bg-background text-foreground">
            <SelectValue placeholder="Select your course" />
          </SelectTrigger>
          <SelectContent>
            {programCategories.map((category) => (
              <SelectGroup key={category.name}>
                <SelectLabel>{category.name}</SelectLabel>
                {category.programs.map((program) => (
                  <SelectItem key={program} value={program}>
                    {program}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="skills"
          className="block text-sm font-medium text-foreground"
        >
          Skills & interests (optional)
        </label>
        <input
          id="skills"
          name="skills"
          type="text"
          value={data.skills}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
          placeholder="e.g. react, api design, machine learning (comma-separated)"
        />
        <p className="text-xs text-muted-foreground">
          Used for problem recommendations. Your course is included automatically if left blank.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          className="col-span-1 font-medium"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          disabled={isLoading}
          className="col-span-2 font-semibold shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 transition-all"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account...
            </div>
          ) : (
            "Complete Registration"
          )}
        </Button>
      </div>
    </form>
  );
}
