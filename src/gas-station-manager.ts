import type { FuelType, Pump, Transaction, Employee, ShiftLog, StationReport } from "./models.js";

export class GasStationManager {
  private fuels: Map<string, FuelType> = new Map();
  private pumps: Map<number, Pump> = new Map();
  private transactions: Transaction[] = [];
  private employees: Map<string, Employee> = new Map();
  private shiftLogs: ShiftLog[] = [];
  private transactionCounter = 0;

  constructor(public readonly stationName: string) {}

  // --- Fuel Management ---

  addFuelType(
    name: string,
    pricePerGallon: number,
    maxCapacity: number,
    initialStock = 0,
  ): FuelType {
    if (this.fuels.has(name)) {
      throw new Error(`Fuel type "${name}" already exists`);
    }
    if (pricePerGallon <= 0) {
      throw new Error("Price per gallon must be positive");
    }
    if (initialStock > maxCapacity) {
      throw new Error("Initial stock cannot exceed max capacity");
    }
    const fuel: FuelType = {
      name,
      pricePerGallon,
      currentStock: initialStock,
      maxCapacity,
    };
    this.fuels.set(name, fuel);
    return fuel;
  }

  updateFuelPrice(name: string, newPrice: number): FuelType {
    const fuel = this.getFuel(name);
    if (newPrice <= 0) {
      throw new Error("Price per gallon must be positive");
    }
    fuel.pricePerGallon = newPrice;
    return fuel;
  }

  refillFuel(name: string, gallons: number): FuelType {
    const fuel = this.getFuel(name);
    if (gallons <= 0) {
      throw new Error("Gallons must be positive");
    }
    if (fuel.currentStock + gallons > fuel.maxCapacity) {
      throw new Error(
        `Refill would exceed capacity. Available space: ${fuel.maxCapacity - fuel.currentStock} gallons`,
      );
    }
    fuel.currentStock += gallons;
    return fuel;
  }

  getFuelStatus(): FuelType[] {
    return Array.from(this.fuels.values());
  }

  // --- Pump Management ---

  addPump(id: number, assignedFuel: string): Pump {
    if (this.pumps.has(id)) {
      throw new Error(`Pump #${id} already exists`);
    }
    this.getFuel(assignedFuel); // validate fuel exists
    const pump: Pump = { id, status: "available", assignedFuel };
    this.pumps.set(id, pump);
    return pump;
  }

  setPumpStatus(id: number, status: Pump["status"]): Pump {
    const pump = this.getPump(id);
    pump.status = status;
    return pump;
  }

  getAvailablePumps(): Pump[] {
    return Array.from(this.pumps.values()).filter((p) => p.status === "available");
  }

  getAllPumps(): Pump[] {
    return Array.from(this.pumps.values());
  }

  // --- Transactions ---

  sellFuel(pumpId: number, gallons: number): Transaction {
    const pump = this.getPump(pumpId);
    if (pump.status !== "available") {
      throw new Error(`Pump #${pumpId} is ${pump.status}`);
    }
    if (gallons <= 0) {
      throw new Error("Gallons must be positive");
    }

    const fuel = this.getFuel(pump.assignedFuel);
    if (fuel.currentStock < gallons) {
      throw new Error(`Insufficient fuel. Available: ${fuel.currentStock} gallons`);
    }

    fuel.currentStock -= gallons;
    this.transactionCounter++;

    const transaction: Transaction = {
      id: `TXN-${String(this.transactionCounter).padStart(6, "0")}`,
      pumpId,
      fuelType: pump.assignedFuel,
      gallons,
      pricePerGallon: fuel.pricePerGallon,
      total: parseFloat((gallons * fuel.pricePerGallon).toFixed(2)),
      timestamp: new Date(),
    };

    this.transactions.push(transaction);
    return transaction;
  }

  getTransactions(limit?: number): Transaction[] {
    const sorted = [...this.transactions].reverse();
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // --- Employee Management ---

  addEmployee(id: string, name: string, role: Employee["role"]): Employee {
    if (this.employees.has(id)) {
      throw new Error(`Employee "${id}" already exists`);
    }
    const employee: Employee = { id, name, role, onShift: false };
    this.employees.set(id, employee);
    return employee;
  }

  clockIn(employeeId: string): ShiftLog {
    const employee = this.getEmployee(employeeId);
    if (employee.onShift) {
      throw new Error(`${employee.name} is already on shift`);
    }
    employee.onShift = true;
    const log: ShiftLog = { employeeId, clockIn: new Date() };
    this.shiftLogs.push(log);
    return log;
  }

  clockOut(employeeId: string): ShiftLog {
    const employee = this.getEmployee(employeeId);
    if (!employee.onShift) {
      throw new Error(`${employee.name} is not on shift`);
    }
    employee.onShift = false;
    const openLog = this.shiftLogs
      .reverse()
      .find((l) => l.employeeId === employeeId && !l.clockOut);
    if (openLog) {
      openLog.clockOut = new Date();
      return openLog;
    }
    throw new Error("No open shift found");
  }

  getOnShiftEmployees(): Employee[] {
    return Array.from(this.employees.values()).filter((e) => e.onShift);
  }

  // --- Reporting ---

  generateReport(): StationReport {
    const totalRevenue = this.transactions.reduce((sum, t) => sum + t.total, 0);
    const totalGallonsSold = this.transactions.reduce((sum, t) => sum + t.gallons, 0);

    const LOW_STOCK_THRESHOLD = 0.2; // 20%
    const fuelLevels = Array.from(this.fuels.values()).map((f) => ({
      name: f.name,
      level: f.currentStock,
      percentage: parseFloat(((f.currentStock / f.maxCapacity) * 100).toFixed(1)),
    }));

    const lowStockAlerts = fuelLevels
      .filter((f) => f.percentage < LOW_STOCK_THRESHOLD * 100)
      .map((f) => `${f.name} is at ${f.percentage}% capacity`);

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalGallonsSold: parseFloat(totalGallonsSold.toFixed(2)),
      transactionCount: this.transactions.length,
      fuelLevels,
      lowStockAlerts,
    };
  }

  // --- Helpers ---

  private getFuel(name: string): FuelType {
    const fuel = this.fuels.get(name);
    if (!fuel) {
      throw new Error(`Fuel type "${name}" not found`);
    }
    return fuel;
  }

  private getPump(id: number): Pump {
    const pump = this.pumps.get(id);
    if (!pump) {
      throw new Error(`Pump #${id} not found`);
    }
    return pump;
  }

  private getEmployee(id: string): Employee {
    const employee = this.employees.get(id);
    if (!employee) {
      throw new Error(`Employee "${id}" not found`);
    }
    return employee;
  }
}
