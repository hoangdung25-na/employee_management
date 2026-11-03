export type DocumentType =
  | "CV"
  | "CitizenId"
  | "Degree"
  | "Certificate"
  | "Contract"
  | "Medical"
  | "Other";

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: DocumentType;
  documentTitle: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  issueDate: string | null;
  expiryDate: string | null;
  isVerified: boolean;
  uploadedByUserId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateEmployeeDocumentInput {
  documentType: DocumentType;
  documentTitle: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  issueDate?: string | null;
  expiryDate?: string | null;
  isVerified: boolean;
  notes?: string | null;
}

