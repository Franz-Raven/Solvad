import { programCategories } from "@/lib/data/programs";
import AutoResizeTextarea from "./AutoResizeTextarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProblemFormFieldsProps {
  formData: {
    title: string;
    backgroundContext: string;
    primaryStatement: string;
    objectives: string;
    constraints: string;
    preferredProgram: string;
  };
  validationErrors: {
    title?: boolean;
    backgroundContext?: boolean;
    primaryStatement?: boolean;
    objectives?: boolean;
    constraints?: boolean;
  };
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onProgramChange: (value: string) => void;
}

export default function ProblemFormFields({
  formData,
  validationErrors,
  onInputChange,
  onProgramChange,
}: ProblemFormFieldsProps) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Problem Title *
          </label>
          {validationErrors.title && (
            <span className="text-xs text-destructive font-medium">
              You need to fill this up
            </span>
          )}
        </div>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={onInputChange}
          className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground ${
            validationErrors.title ? 'border-destructive' : 'border-border'
          }`}
          placeholder="e.g., Automated Inventory Management System"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="backgroundContext" className="block text-sm font-medium text-foreground">
            Background Context *
          </label>
          {validationErrors.backgroundContext && (
            <span className="text-xs text-destructive font-medium">
              You need to fill this up
            </span>
          )}
        </div>
        <AutoResizeTextarea
          id="backgroundContext"
          name="backgroundContext"
          value={formData.backgroundContext}
          onChange={onInputChange}
          minRows={4}
          className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground ${
            validationErrors.backgroundContext ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Describe the industry context, current situation, and why this problem needs solving"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="primaryStatement" className="block text-sm font-medium text-foreground">
            Primary Problem Statement *
          </label>
          {validationErrors.primaryStatement && (
            <span className="text-xs text-destructive font-medium">
              You need to fill this up
            </span>
          )}
        </div>
        <AutoResizeTextarea
          id="primaryStatement"
          name="primaryStatement"
          value={formData.primaryStatement}
          onChange={onInputChange}
          minRows={4}
          className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground ${
            validationErrors.primaryStatement ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Clearly state the core problem that needs to be addressed"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="objectives" className="block text-sm font-medium text-foreground">
            Objectives *
          </label>
          {validationErrors.objectives && (
            <span className="text-xs text-destructive font-medium">
              You need to fill this up
            </span>
          )}
        </div>
        <AutoResizeTextarea
          id="objectives"
          name="objectives"
          value={formData.objectives}
          onChange={onInputChange}
          minRows={3}
          className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground ${
            validationErrors.objectives ? 'border-destructive' : 'border-border'
          }`}
          placeholder="What are the desired outcomes and goals?"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="constraints" className="block text-sm font-medium text-foreground">
            Constraints *
          </label>
          {validationErrors.constraints && (
            <span className="text-xs text-destructive font-medium">
              You need to fill this up
            </span>
          )}
        </div>
        <AutoResizeTextarea
          id="constraints"
          name="constraints"
          value={formData.constraints}
          onChange={onInputChange}
          minRows={3}
          className={`w-full px-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground ${
            validationErrors.constraints ? 'border-destructive' : 'border-border'
          }`}
          placeholder="Budget limits, timeline, technical requirements, etc."
        />
      </div>

      <div>
        <label htmlFor="preferredProgram" className="block text-sm font-medium text-foreground mb-2">
          Preferred Academic Program *
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Select the academic program most suitable for solving this problem
        </p>
        
        <Select value={formData.preferredProgram} onValueChange={onProgramChange}>
          <SelectTrigger className="w-full px-4 py-3 !h-auto rounded-lg border border-border bg-background text-foreground">
            <SelectValue placeholder="Select a program" />
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
    </>
  );
}
