import { describe, it, expect, beforeEach } from "vitest";
import { GasStationManager } from "./gas-station-manager.js";

describe("GasStationManager", () => {
  let station: GasStationManager;

  beforeEach(() => {
    station = new GasStationManager("Test Station");
  });

  describe("Fuel Management", () => {
    it("adds a fuel type", () => {
      const fuel = station.addFuelType("Regular", 3.49, 10000, 5000);
      expect(fuel.name).toBe("Regular");
      expect(fuel.pricePerGallon).toBe(3.49);
      expect(fuel.currentStock).toBe(5000);
      expect(fuel.maxCapacity).toBe(10000);
    });

    it("rejects duplicate fuel types", () => {
      station.addFuelType("Regular", 3.49, 10000);
      expect(() => station.addFuelType("Regular", 3.99, 5000)).toThrow(
        'Fuel type "Regular" already exists',
      );
    });

    it("rejects non-positive price", () => {
      expect(() => station.addFuelType("Regular", 0, 10000)).toThrow(
        "Price per gallon must be positive",
      );
    });

    it("rejects initial stock exceeding capacity", () => {
      expect(() => station.addFuelType("Regular", 3.49, 100, 200)).toThrow(
        "Initial stock cannot exceed max capacity",
      );
    });

    it("updates fuel price", () => {
      station.addFuelType("Regular", 3.49, 10000);
      const updated = station.updateFuelPrice("Regular", 3.99);
      expect(updated.pricePerGallon).toBe(3.99);
    });

    it("refills fuel", () => {
      station.addFuelType("Regular", 3.49, 10000, 5000);
      const refilled = station.refillFuel("Regular", 3000);
      expect(refilled.currentStock).toBe(8000);
    });

    it("rejects refill exceeding capacity", () => {
      station.addFuelType("Regular", 3.49, 10000, 9000);
      expect(() => station.refillFuel("Regular", 2000)).toThrow("exceed capacity");
    });

    it("returns all fuel statuses", () => {
      station.addFuelType("Regular", 3.49, 10000);
      station.addFuelType("Premium", 4.29, 8000);
      expect(station.getFuelStatus()).toHaveLength(2);
    });
  });

  describe("Pump Management", () => {
    beforeEach(() => {
      station.addFuelType("Regular", 3.49, 10000, 5000);
    });

    it("adds a pump", () => {
      const pump = station.addPump(1, "Regular");
      expect(pump.id).toBe(1);
      expect(pump.status).toBe("available");
      expect(pump.assignedFuel).toBe("Regular");
    });

    it("rejects duplicate pump ids", () => {
      station.addPump(1, "Regular");
      expect(() => station.addPump(1, "Regular")).toThrow("Pump #1 already exists");
    });

    it("rejects pump with unknown fuel", () => {
      expect(() => station.addPump(1, "Hydrogen")).toThrow('Fuel type "Hydrogen" not found');
    });

    it("sets pump status", () => {
      station.addPump(1, "Regular");
      const updated = station.setPumpStatus(1, "out-of-order");
      expect(updated.status).toBe("out-of-order");
    });

    it("filters available pumps", () => {
      station.addPump(1, "Regular");
      station.addPump(2, "Regular");
      station.setPumpStatus(2, "out-of-order");
      expect(station.getAvailablePumps()).toHaveLength(1);
    });
  });

  describe("Transactions", () => {
    beforeEach(() => {
      station.addFuelType("Regular", 3.49, 10000, 5000);
      station.addPump(1, "Regular");
    });

    it("processes a fuel sale", () => {
      const txn = station.sellFuel(1, 10);
      expect(txn.gallons).toBe(10);
      expect(txn.total).toBe(34.9);
      expect(txn.fuelType).toBe("Regular");
      expect(txn.id).toMatch(/^TXN-/);
    });

    it("reduces fuel stock after sale", () => {
      station.sellFuel(1, 100);
      const fuels = station.getFuelStatus();
      expect(fuels[0].currentStock).toBe(4900);
    });

    it("rejects sale on unavailable pump", () => {
      station.setPumpStatus(1, "out-of-order");
      expect(() => station.sellFuel(1, 10)).toThrow("out-of-order");
    });

    it("rejects sale exceeding stock", () => {
      expect(() => station.sellFuel(1, 6000)).toThrow("Insufficient fuel");
    });

    it("rejects non-positive gallons", () => {
      expect(() => station.sellFuel(1, 0)).toThrow("Gallons must be positive");
    });

    it("returns transactions in reverse order", () => {
      station.sellFuel(1, 5);
      station.sellFuel(1, 10);
      const txns = station.getTransactions();
      expect(txns[0].gallons).toBe(10);
      expect(txns[1].gallons).toBe(5);
    });

    it("limits returned transactions", () => {
      station.sellFuel(1, 5);
      station.sellFuel(1, 10);
      station.sellFuel(1, 15);
      expect(station.getTransactions(2)).toHaveLength(2);
    });
  });

  describe("Employee Management", () => {
    it("adds an employee", () => {
      const emp = station.addEmployee("E001", "Alice", "manager");
      expect(emp.id).toBe("E001");
      expect(emp.onShift).toBe(false);
    });

    it("rejects duplicate employee id", () => {
      station.addEmployee("E001", "Alice", "manager");
      expect(() => station.addEmployee("E001", "Bob", "attendant")).toThrow(
        'Employee "E001" already exists',
      );
    });

    it("clocks in and out", () => {
      station.addEmployee("E001", "Alice", "manager");
      station.clockIn("E001");
      expect(station.getOnShiftEmployees()).toHaveLength(1);
      station.clockOut("E001");
      expect(station.getOnShiftEmployees()).toHaveLength(0);
    });

    it("rejects double clock-in", () => {
      station.addEmployee("E001", "Alice", "manager");
      station.clockIn("E001");
      expect(() => station.clockIn("E001")).toThrow("already on shift");
    });

    it("rejects clock-out when not on shift", () => {
      station.addEmployee("E001", "Alice", "manager");
      expect(() => station.clockOut("E001")).toThrow("not on shift");
    });
  });

  describe("Reporting", () => {
    it("generates a complete report", () => {
      station.addFuelType("Regular", 3.49, 10000, 5000);
      station.addFuelType("Premium", 4.29, 8000, 800);
      station.addPump(1, "Regular");
      station.sellFuel(1, 10);
      station.sellFuel(1, 20);

      const report = station.generateReport();
      expect(report.totalRevenue).toBe(104.7);
      expect(report.totalGallonsSold).toBe(30);
      expect(report.transactionCount).toBe(2);
      expect(report.fuelLevels).toHaveLength(2);
      expect(report.lowStockAlerts).toHaveLength(1);
      expect(report.lowStockAlerts[0]).toContain("Premium");
    });

    it("returns empty report for new station", () => {
      const report = station.generateReport();
      expect(report.totalRevenue).toBe(0);
      expect(report.transactionCount).toBe(0);
      expect(report.lowStockAlerts).toHaveLength(0);
    });
  });
});
