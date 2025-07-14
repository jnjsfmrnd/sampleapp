export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  typeOfDisability: string;
  province: string;
  city: string;
  dateValid: string; // ISO date string
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  isDeleted?: boolean;
  deletedAt?: string | null; // ISO date string or null
  isAdmin?: boolean;
  modifiedBy?: string | null; // username or id of admin who last modified
}
