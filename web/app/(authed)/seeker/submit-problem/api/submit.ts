import { apiRequest } from "@/lib/api";
import type {
  GenerateScopeRequest,
  GenerateScopeResponse,
  ProblemRequest,
  ProblemResponse,
} from "@/types/problem";

/**
 * Sends problem context to generate AI-suggested sub-tasks and handles file attachments via FormData.
 */
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

/**
 * Finalizes and creates the problem after the Seeker reviews the scope.
 */
export async function createProblem(
  data: ProblemRequest
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>("/problems", {
    method: "POST",
    body: JSON.stringify(data),
  });
}