import type { FuelType, Pump, Transaction, Employee, ShiftLog, StationReport } from "./models.js";

export class GasStationManager {
  private fuels: Map<string, FuelType> = new Map();
  private pumps: Map<number, Pump> = new Map();
  private transactions: Transaction[] = [];
  private employees: Map<string, Employee> = new Map();
  private shiftLogs: ShiftLog[] = [];
  private transactionCounter = 0;

  constructor(public readonly stationName: string) {}

  // --- 燃油管理 ---

  addFuelType(
    name: string,
    pricePerLiter: number,
    maxCapacity: number,
    initialStock = 0,
  ): FuelType {
    if (this.fuels.has(name)) {
      throw new Error(`燃油类型"${name}"已存在`);
    }
    if (pricePerLiter <= 0) {
      throw new Error("每升价格必须为正数");
    }
    if (initialStock > maxCapacity) {
      throw new Error("初始库存不能超过最大容量");
    }
    const fuel: FuelType = {
      name,
      pricePerLiter,
      currentStock: initialStock,
      maxCapacity,
    };
    this.fuels.set(name, fuel);
    return fuel;
  }

  updateFuelPrice(name: string, newPrice: number): FuelType {
    const fuel = this.getFuel(name);
    if (newPrice <= 0) {
      throw new Error("每升价格必须为正数");
    }
    fuel.pricePerLiter = newPrice;
    return fuel;
  }

  refillFuel(name: string, liters: number): FuelType {
    const fuel = this.getFuel(name);
    if (liters <= 0) {
      throw new Error("升数必须为正数");
    }
    if (fuel.currentStock + liters > fuel.maxCapacity) {
      throw new Error(`补充量超出容量。可用空间：${fuel.maxCapacity - fuel.currentStock}升`);
    }
    fuel.currentStock += liters;
    return fuel;
  }

  getFuelStatus(): FuelType[] {
    return Array.from(this.fuels.values());
  }

  // --- 油枪管理 ---

  addPump(id: number, assignedFuel: string): Pump {
    if (this.pumps.has(id)) {
      throw new Error(`${id}号油枪已存在`);
    }
    this.getFuel(assignedFuel); // 验证燃油类型是否存在
    const pump: Pump = { id, status: "空闲", assignedFuel };
    this.pumps.set(id, pump);
    return pump;
  }

  setPumpStatus(id: number, status: Pump["status"]): Pump {
    const pump = this.getPump(id);
    pump.status = status;
    return pump;
  }

  getAvailablePumps(): Pump[] {
    return Array.from(this.pumps.values()).filter((p) => p.status === "空闲");
  }

  getAllPumps(): Pump[] {
    return Array.from(this.pumps.values());
  }

  // --- 交易管理 ---

  sellFuel(pumpId: number, liters: number): Transaction {
    const pump = this.getPump(pumpId);
    if (pump.status !== "空闲") {
      throw new Error(`${pumpId}号油枪当前状态：${pump.status}`);
    }
    if (liters <= 0) {
      throw new Error("升数必须为正数");
    }

    const fuel = this.getFuel(pump.assignedFuel);
    if (fuel.currentStock < liters) {
      throw new Error(`燃油不足。当前库存：${fuel.currentStock}升`);
    }

    fuel.currentStock -= liters;
    this.transactionCounter++;

    const transaction: Transaction = {
      id: `TXN-${String(this.transactionCounter).padStart(6, "0")}`,
      pumpId,
      fuelType: pump.assignedFuel,
      liters,
      pricePerLiter: fuel.pricePerLiter,
      total: parseFloat((liters * fuel.pricePerLiter).toFixed(2)),
      timestamp: new Date(),
    };

    this.transactions.push(transaction);
    return transaction;
  }

  getTransactions(limit?: number): Transaction[] {
    const sorted = [...this.transactions].reverse();
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // --- 员工管理 ---

  addEmployee(id: string, name: string, role: Employee["role"]): Employee {
    if (this.employees.has(id)) {
      throw new Error(`员工"${id}"已存在`);
    }
    const employee: Employee = { id, name, role, onShift: false };
    this.employees.set(id, employee);
    return employee;
  }

  clockIn(employeeId: string): ShiftLog {
    const employee = this.getEmployee(employeeId);
    if (employee.onShift) {
      throw new Error(`${employee.name}已在班中`);
    }
    employee.onShift = true;
    const log: ShiftLog = { employeeId, clockIn: new Date() };
    this.shiftLogs.push(log);
    return log;
  }

  clockOut(employeeId: string): ShiftLog {
    const employee = this.getEmployee(employeeId);
    if (!employee.onShift) {
      throw new Error(`${employee.name}当前不在班`);
    }
    employee.onShift = false;
    const openLog = this.shiftLogs
      .reverse()
      .find((l) => l.employeeId === employeeId && !l.clockOut);
    if (openLog) {
      openLog.clockOut = new Date();
      return openLog;
    }
    throw new Error("未找到未结束的班次");
  }

  getOnShiftEmployees(): Employee[] {
    return Array.from(this.employees.values()).filter((e) => e.onShift);
  }

  // --- 报表 ---

  generateReport(): StationReport {
    const totalRevenue = this.transactions.reduce((sum, t) => sum + t.total, 0);
    const totalLitersSold = this.transactions.reduce((sum, t) => sum + t.liters, 0);

    const LOW_STOCK_THRESHOLD = 0.2; // 20%
    const fuelLevels = Array.from(this.fuels.values()).map((f) => ({
      name: f.name,
      level: f.currentStock,
      percentage: parseFloat(((f.currentStock / f.maxCapacity) * 100).toFixed(1)),
    }));

    const lowStockAlerts = fuelLevels
      .filter((f) => f.percentage < LOW_STOCK_THRESHOLD * 100)
      .map((f) => `${f.name}库存仅剩${f.percentage}%`);

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalLitersSold: parseFloat(totalLitersSold.toFixed(2)),
      transactionCount: this.transactions.length,
      fuelLevels,
      lowStockAlerts,
    };
  }

  // --- 内部方法 ---

  private getFuel(name: string): FuelType {
    const fuel = this.fuels.get(name);
    if (!fuel) {
      throw new Error(`燃油类型"${name}"不存在`);
    }
    return fuel;
  }

  private getPump(id: number): Pump {
    const pump = this.pumps.get(id);
    if (!pump) {
      throw new Error(`${id}号油枪不存在`);
    }
    return pump;
  }

  private getEmployee(id: string): Employee {
    const employee = this.employees.get(id);
    if (!employee) {
      throw new Error(`员工"${id}"不存在`);
    }
    return employee;
  }
}
