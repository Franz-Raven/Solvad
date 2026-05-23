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

interface EnhancedProblemPreviewProps {
  problem: {
    title: string;
    backgroundContext: string;
    primaryStatement: string;
    objectives: string[];
    constraints: string[];
    sdgFocus?: string;
  };
  preferredProgram: string;
  attachments: File[];
  onProblemChange: (field: string, value: string | string[]) => void;
  onProgramChange: (value: string) => void;
}

export default function EnhancedProblemPreview({
  problem,
  preferredProgram,
  attachments,
  onProblemChange,
  onProgramChange,
}: EnhancedProblemPreviewProps) {
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...problem.objectives];
    newObjectives[index] = value;
    onProblemChange("objectives", newObjectives);
  };

  const handleConstraintChange = (index: number, value: string) => {
    const newConstraints = [...problem.constraints];
    newConstraints[index] = value;
    onProblemChange("constraints", newConstraints);
  };

  const handleAddObjective = () => {
    onProblemChange("objectives", [...problem.objectives, ""]);
  };

  const handleRemoveObjective = (index: number) => {
    onProblemChange("objectives", problem.objectives.filter((_, i) => i !== index));
  };

  const handleAddConstraint = () => {
    onProblemChange("constraints", [...problem.constraints, ""]);
  };

  const handleRemoveConstraint = (index: number) => {
    onProblemChange("constraints", problem.constraints.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Finalized Problem Information</h2>
        
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Problem Title
          </label>
          <input
            type="text"
            value={problem.title}
            onChange={(e) => onProblemChange("title", e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-foreground"
          />
        </div>

        {/* Background Context */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Background Context
          </label>
          <AutoResizeTextarea
            value={problem.backgroundContext}
            onChange={(e) => onProblemChange("backgroundContext", e.target.value)}
            minRows={4}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-foreground"
          />
        </div>

        {/* Primary Statement */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Primary Problem Statement
          </label>
          <AutoResizeTextarea
            value={problem.primaryStatement}
            onChange={(e) => onProblemChange("primaryStatement", e.target.value)}
            minRows={4}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-foreground"
          />
        </div>

        {/* Objectives */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Objectives
          </label>
          <div className="space-y-2">
            {problem.objectives.map((objective, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-3">•</span>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-secondary text-foreground text-sm"
                  placeholder={`Objective ${index + 1}`}
                />
                <button
                  onClick={() => handleRemoveObjective(index)}
                  className="mt-2 text-destructive hover:text-destructive/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddObjective}
            className="mt-2 text-sm text-secondary hover:text-accent transition-colors"
          >
            + Add Objective
          </button>
        </div>

        {/* Constraints */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Constraints
          </label>
          <div className="space-y-2">
            {problem.constraints.map((constraint, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-3">•</span>
                <input
                  type="text"
                  value={constraint}
                  onChange={(e) => handleConstraintChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-secondary text-foreground text-sm"
                  placeholder={`Constraint ${index + 1}`}
                />
                <button
                  onClick={() => handleRemoveConstraint(index)}
                  className="mt-2 text-destructive hover:text-destructive/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddConstraint}
            className="mt-2 text-sm text-secondary hover:text-accent transition-colors"
          >
            + Add Constraint
          </button>
        </div>

        {/* Preferred Program and SDG Focus (side by side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Preferred Academic Program
            </label>
            <Select value={preferredProgram} onValueChange={onProgramChange}>
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

          {problem.sdgFocus && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sustainable Development Goal (AI-Generated)
              </label>
              <div className="w-full px-4 py-3 bg-secondary/5 border border-secondary/20 rounded-lg text-foreground flex items-center">
                <svg className="w-5 h-5 text-secondary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{problem.sdgFocus}</span>
              </div>
            </div>
          )}
        </div>

        {/* Show attached files if present */}
        {attachments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Uploaded Files
            </label>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg"
                >
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
