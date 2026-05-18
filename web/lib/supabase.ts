// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFileToSupabase(
  file: File,
  bucketName: string = "problem-documents" // Change this to your actual Supabase bucket name
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `documents/${fileName}`;

  const { error } = await supabase.storage.from(bucketName).upload(filePath, file);

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return publicUrlData.publicUrl;
}