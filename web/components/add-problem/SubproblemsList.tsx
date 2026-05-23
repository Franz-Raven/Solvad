import { programCategories } from "@/lib/data/programs";
import type { SubProblem } from "@/types/problem";
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

interface SubproblemsListProps {
  subProblems: SubProblem[];
  onSubProblemChange: (id: string, field: keyof SubProblem, value: string) => void;
  onDeleteSubProblem: (id: string) => void;
  onAddSubProblem: () => void;
}

export default function SubproblemsList({
  subProblems,
  onSubProblemChange,
  onDeleteSubProblem,
  onAddSubProblem,
}: SubproblemsListProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Generated Sub-Problems</h2>
      
      <div className="space-y-4 mb-6">
        {subProblems.map((subProblem) => (
          <div
            key={subProblem.id}
            className="p-4 border border-border rounded-lg bg-background"
          >
            <div className="flex justify-between items-start mb-3">
              <input
                type="text"
                value={subProblem.title}
                onChange={(e) =>
                  onSubProblemChange(subProblem.id, "title", e.target.value)
                }
                className="flex-1 text-lg font-semibold bg-transparent border-b border-border focus:border-secondary focus:outline-none text-foreground pb-1"
                placeholder="Sub-task Title"
              />
              <button
                onClick={() => onDeleteSubProblem(subProblem.id)}
                className="ml-4 text-destructive hover:text-destructive/80 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <Select
                value={subProblem.departmentFocus}
                onValueChange={(value) =>
                  onSubProblemChange(subProblem.id, "departmentFocus", value)
                }
              >
                <SelectTrigger className="w-full px-4 py-3 !h-auto rounded border border-border bg-background text-foreground">
                  <SelectValue placeholder="Select academic program focus" />
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

              {subProblem.sdgFocus && (
                <div className="px-4 py-3 bg-secondary/5 border border-secondary/20 rounded flex items-start gap-2">
                  <svg className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground mb-1">SDG Focus (AI-Generated)</div>
                    <div className="text-sm text-foreground">{subProblem.sdgFocus}</div>
                  </div>
                </div>
              )}

              <AutoResizeTextarea
                value={subProblem.description}
                onChange={(e) =>
                  onSubProblemChange(
                    subProblem.id,
                    "description",
                    e.target.value
                  )
                }
                minRows={3}
                className="w-full px-4 py-3 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-secondary text-foreground"
                placeholder="Description"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAddSubProblem}
        className="w-full py-3 border-2 border-dashed border-border hover:border-secondary text-foreground hover:text-secondary font-semibold rounded-lg transition-all"
      >
        + Add Sub-problem
      </button>
    </div>
  );
}
