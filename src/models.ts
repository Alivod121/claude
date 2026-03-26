export interface FuelType {
  name: string;
  pricePerGallon: number;
  currentStock: number; // gallons
  maxCapacity: number; // gallons
}

export interface Pump {
  id: number;
  status: "available" | "in-use" | "out-of-order";
  assignedFuel: string;
}

export interface Transaction {
  id: string;
  pumpId: number;
  fuelType: string;
  gallons: number;
  pricePerGallon: number;
  total: number;
  timestamp: Date;
}

export interface Employee {
  id: string;
  name: string;
  role: "manager" | "attendant" | "cashier";
  onShift: boolean;
}

export interface ShiftLog {
  employeeId: string;
  clockIn: Date;
  clockOut?: Date;
}

export interface StationReport {
  totalRevenue: number;
  totalGallonsSold: number;
  transactionCount: number;
  fuelLevels: { name: string; level: number; percentage: number }[];
  lowStockAlerts: string[];
}
