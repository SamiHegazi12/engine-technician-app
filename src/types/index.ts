export enum RepairStatus {
  NEW = 'جديد',
  IN_PROGRESS = 'قيد العمل',
  WAITING_PARTS = 'في إنتظار القطع',
  COMPLETED = 'مكتمل',
  DELIVERED = 'تم التسليم'
}

export interface Claim {
  id: string;
  description: string;
  cost: number;
}

export interface VehicleData {
  type: string;
  model: string;
  year: string;
  odometer: number;
  color: string;
  plateType: 'Saudi' | 'Foreign';
  plateLetters?: string;
  plateNumbers: string;
  vin: string;
}

export interface CustomerData {
  fullName: string;
  phone: string;
  idNumber: string;
}

export interface RepairAgreement {
  id: string;
  serialNumber: string;
  createdAt: string;
  expectedDeliveryDate: string;
  jobCardNumber?: string;
  vehicle: VehicleData;
  customer: CustomerData;
  claims: Claim[];
  discountPercent: number;
  photos: string[];
  signature?: string;
  status: RepairStatus;
  termsAccepted: boolean;
}