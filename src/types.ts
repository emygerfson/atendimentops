export type UserRole = "admin" | "doctor" | "nurse" | "receptionist";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  crm?: string;
  coren?: string;
  password?: string;
}

export type PatientStatus = 
  | "Aguardando Triagem" 
  | "Em Triagem" 
  | "Aguardando Médico" 
  | "Em Consulta" 
  | "Aguardando Medicação" 
  | "Em Medicação" 
  | "Alta";

export interface Patient {
  id: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  insurance: string;
  gender: string;
  mainSymptom: string;
  status: PatientStatus;
  ticketNumber: string;
  createdAt: string;
}

export type RiskLevel = "EMERGÊNCIA" | "MUITO URGENTE" | "URGENTE" | "POUCO URGENTE" | "NÃO URGENTE";

export interface Triage {
  id: string;
  patientId: string;
  bloodPressure: string;
  temperature: number;
  saturation: number;
  observations: string;
  riskLevel: RiskLevel;
  nurseId: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medicationName: string;
  dosage: string;
  route: string;
  schedule: string;
  administered?: boolean;
}

export interface Consultation {
  id: string;
  patientId: string;
  mainComplaint: string;
  history: string;
  physicalExam: string;
  diagnosis: string;
  prescription: PrescriptionItem[];
  doctorId: string;
  status: "Pendente" | "Finalizada";
  createdAt: string;
}

export interface MedicationAdministration {
  id: string;
  patientId: string;
  consultationId: string;
  medicationName: string;
  dosage: string;
  route: string;
  schedule: string;
  administered: boolean;
  nurseNotes: string;
  administeredAt?: string;
  nurseId?: string;
}

export interface Call {
  id: string;
  patientName: string;
  ticketNumber: string;
  sector: string;
  timestamp: any;
}
