import { apiRequest } from "../api";
import type {
  DiscoveryDashboardResponse,
  GenerateScopeRequest,
  GenerateScopeResponse,
  ProblemRequest,
  ProblemResponse,
  SeekerNotification,
  PaginatedProblemsResponse,
  SeekerProblemListResponse,
} from "@/types/problem";
import type { ClaimRequestResponse } from "@/types/attempt";

export async function generateScope(
  data: GenerateScopeRequest
): Promise<GenerateScopeResponse> {
  console.log("=== GENERATE SCOPE REQUEST ===");
  console.log("Request Data:", data);
  console.log("Attachments count:", data.attachments?.length || 0);
  
  const formData = new FormData();
  
  // Add the JSON data as a string
  const { attachments, ...requestData } = data;
  formData.append('data', JSON.stringify(requestData));
  
  // Add file attachments if present
  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      console.log(`Attaching file: ${file.name} (${file.type}, ${file.size} bytes)`);
      formData.append('attachments', file);
    });
  }
  
  // Use FormData instead of JSON
  const response = await apiRequest<GenerateScopeResponse>("/problems/generate-scope", {
    method: "POST",
    body: formData,
    // Don't set Content-Type header - FormData will set it with boundary
  });
  
  console.log("=== GENERATE SCOPE RESPONSE ===");
  console.log("Generated Subtasks:", response.generatedSubtasks);
  console.log("Subtasks count:", response.generatedSubtasks?.length || 0);
  
  return response;
}

export async function createProblem(
  data: ProblemRequest
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>("/problems", {
    method: "POST",
    body: JSON.stringify(data),
  });
}



export async function searchMyProblems(
  query?: string,
  sdgFilter?: string,
  dateSort?: string,
  page: number = 0,
  size: number = 20
): Promise<PaginatedProblemsResponse> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (sdgFilter) params.set("sdgFilter", sdgFilter);
  if (dateSort) params.set("dateSort", dateSort);
  params.set("page", page.toString());
  params.set("size", size.toString());
  
  return apiRequest<PaginatedProblemsResponse>(
    `/problems/my-problems/search?${params.toString()}`,
    { method: "GET" }
  );
}






export async function getOpenProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems/open", {
    method: "GET",
  });
}

export interface DiscoveryQuery {
  search?: string;
  tags?: string;
}



