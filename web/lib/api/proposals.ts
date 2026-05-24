import { apiRequest } from "./index";
import type { ProposalDTO, ClaimRequestResponse } from "@/types/proposal";

// POST /api/problems/{problemId}/proposals (Solver Action)
export async function submitProposal(problemId: string, proposalData: ProposalDTO): Promise<ClaimRequestResponse> {
  return apiRequest<ClaimRequestResponse>(`/problems/${problemId}/proposals`, {
    method: "POST",
    body: JSON.stringify(proposalData),
  });
}