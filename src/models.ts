export interface FuelType {
  name: string;
  pricePerLiter: number;
  currentStock: number; // 升
  maxCapacity: number; // 升
}

export interface Pump {
  id: number;
  status: "空闲" | "使用中" | "故障";
  assignedFuel: string;
}

export interface Transaction {
  id: string;
  pumpId: number;
  fuelType: string;
  liters: number;
  pricePerLiter: number;
  total: number;
  timestamp: Date;
}

export interface Employee {
  id: string;
  name: string;
  role: "经理" | "加油员" | "收银员";
  onShift: boolean;
}

export interface ShiftLog {
  employeeId: string;
  clockIn: Date;
  clockOut?: Date;
}

export interface StationReport {
  totalRevenue: number;
  totalLitersSold: number;
  transactionCount: number;
  fuelLevels: { name: string; level: number; percentage: number }[];
  lowStockAlerts: string[];
}
