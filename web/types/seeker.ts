export interface SeekerProfile {
  id: string;
  userId: string;
  email: string;
  organizationName: string;
  contactPerson: string;
  contactNumber?: string;
  profileUrl?: string;
}

export interface SeekerProfileRequest {
  organizationName: string;
  contactPerson: string;
  contactNumber?: string;
}

export interface UpdateSeekerProfilePayload {
  organizationName: string;
  contactPerson: string;
  contactNumber?: string;
}
