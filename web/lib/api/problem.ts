import { apiRequest } from "../api";
import type {
  GenerateScopeRequest,
  GenerateScopeResponse,
  ProblemRequest,
  ProblemResponse,
} from "@/types/problem";

export async function generateScope(
  data: GenerateScopeRequest
): Promise<GenerateScopeResponse> {
  return apiRequest<GenerateScopeResponse>("/problems/generate-scope", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createProblem(
  data: ProblemRequest
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>("/problems", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems/my-problems", {
    method: "GET",
  });
}

export async function getProblemById(
  problemId: string
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>(`/problems/${problemId}`, {
    method: "GET",
  });
}
