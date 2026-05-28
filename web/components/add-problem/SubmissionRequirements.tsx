import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SubProblem, AttachmentRequirement } from "@/types/problem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  subProblems: SubProblem[];
  globalRequirements: AttachmentRequirement[];
  setGlobalRequirements: (reqs: AttachmentRequirement[]) => void;
  onSubProblemUpdate: (id: string, requirements: AttachmentRequirement[]) => void;
}

export default function SubmissionRequirements({
  subProblems,
  globalRequirements,
  setGlobalRequirements,
  onSubProblemUpdate,
}: Props) {
  const addRequirement = (isGlobal: boolean, subtaskId?: string) => {
    const newReq: AttachmentRequirement = {
      id: `req-${Date.now()}`,
      attachmentTitle: "",
      attachmentType: "",
    };

    if (isGlobal) {
      setGlobalRequirements([...globalRequirements, newReq]);
    } else if (subtaskId) {
      const subtask = subProblems.find((sp) => sp.id === subtaskId);
      if (subtask) {
        const currentReqs = subtask.attachments || [];
        onSubProblemUpdate(subtaskId, [...currentReqs, newReq]);
      }
    }
  };

  const updateRequirement = (
    isGlobal: boolean,
    reqId: string,
    field: keyof AttachmentRequirement,
    value: string,
    subtaskId?: string
  ) => {
    if (isGlobal) {
      setGlobalRequirements(
        globalRequirements.map((r) => (r.id === reqId ? { ...r, [field]: value } : r))
      );
    } else if (subtaskId) {
      const subtask = subProblems.find((sp) => sp.id === subtaskId);
      if (subtask) {
        const updated = (subtask.attachments || []).map((r) =>
          r.id === reqId ? { ...r, [field]: value } : r
        );
        onSubProblemUpdate(subtaskId, updated);
      }
    }
  };

  const removeRequirement = (isGlobal: boolean, reqId: string, subtaskId?: string) => {
    if (isGlobal) {
      setGlobalRequirements(globalRequirements.filter((r) => r.id !== reqId));
    } else if (subtaskId) {
      const subtask = subProblems.find((sp) => sp.id === subtaskId);
      if (subtask) {
        const filtered = (subtask.attachments || []).filter((r) => r.id !== reqId);
        onSubProblemUpdate(subtaskId, filtered);
      }
    }
  };

  const RequirementRow = ({ req, isGlobal, subtaskId }: { req: AttachmentRequirement, isGlobal: boolean, subtaskId?: string }) => (
    <div className="flex gap-4 items-center mt-3">
      <input
        type="text"
        placeholder="File Title (e.g., Financial Report)"
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={req.attachmentTitle}
        onChange={(e) => updateRequirement(isGlobal, req.id, "attachmentTitle", e.target.value, subtaskId)}
      />
      <Select
        value={req.attachmentType}
        onValueChange={(val) => updateRequirement(isGlobal, req.id, "attachmentType", val, subtaskId)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select File Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PDF">PDF</SelectItem>
          <SelectItem value="EXCEL">Excel (.xlsx)</SelectItem>
          <SelectItem value="GITHUB_LINK">GitHub Link</SelectItem>
          <SelectItem value="PNG_JPG">Image (PNG/JPG)</SelectItem>
        </SelectContent>
      </Select>
      <button
        type="button"
        onClick={() => removeRequirement(isGlobal, req.id, subtaskId)}
        className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="mt-8 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold">Files to be submitted by the solver</h2>
        <p className="text-muted-foreground text-sm">
          Define what files you expect the solvers to attach when submitting their solutions.
        </p>
      </div>

      {/* Global Requirements */}
      <div className="bg-accent/10 p-5 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Global Submissions (Applies to ALL sub-problems)</h3>
          <button
            type="button"
            onClick={() => addRequirement(true)}
            className="text-sm flex items-center text-secondary hover:text-secondary/80 font-medium"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Global File
          </button>
        </div>
        {globalRequirements.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No global requirements added.</p>
        ) : (
          globalRequirements.map((req) => (
            <RequirementRow key={req.id} req={req} isGlobal={true} />
          ))
        )}
      </div>

      {/* Per-Subproblem Requirements */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Sub-problem Specific Submissions</h3>
        {subProblems.map((sp) => (
          <div key={sp.id} className="border border-border p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm">{sp.title || "Untitled Sub-problem"}</span>
              <button
                type="button"
                onClick={() => addRequirement(false, sp.id)}
                className="text-sm flex items-center text-secondary hover:text-secondary/80 font-medium"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Specific File
              </button>
            </div>
            {(!sp.attachments || sp.attachments.length === 0) ? (
              <p className="text-sm text-muted-foreground italic mt-2">No specific files requested for this task.</p>
            ) : (
              sp.attachments.map((req) => (
                <RequirementRow key={req.id} req={req} isGlobal={false} subtaskId={sp.id} />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}