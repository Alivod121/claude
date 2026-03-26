import { describe, it, expect, beforeEach } from "vitest";
import { GasStationManager } from "./gas-station-manager.js";

describe("加油站管理系统", () => {
  let station: GasStationManager;

  beforeEach(() => {
    station = new GasStationManager("测试加油站");
  });

  describe("燃油管理", () => {
    it("添加燃油类型", () => {
      const fuel = station.addFuelType("92号汽油", 7.89, 10000, 5000);
      expect(fuel.name).toBe("92号汽油");
      expect(fuel.pricePerLiter).toBe(7.89);
      expect(fuel.currentStock).toBe(5000);
      expect(fuel.maxCapacity).toBe(10000);
    });

    it("拒绝重复的燃油类型", () => {
      station.addFuelType("92号汽油", 7.89, 10000);
      expect(() => station.addFuelType("92号汽油", 8.0, 5000)).toThrow("已存在");
    });

    it("拒绝非正数价格", () => {
      expect(() => station.addFuelType("92号汽油", 0, 10000)).toThrow("必须为正数");
    });

    it("拒绝初始库存超过最大容量", () => {
      expect(() => station.addFuelType("92号汽油", 7.89, 100, 200)).toThrow("不能超过最大容量");
    });

    it("更新燃油价格", () => {
      station.addFuelType("92号汽油", 7.89, 10000);
      const updated = station.updateFuelPrice("92号汽油", 8.19);
      expect(updated.pricePerLiter).toBe(8.19);
    });

    it("补充燃油", () => {
      station.addFuelType("92号汽油", 7.89, 10000, 5000);
      const refilled = station.refillFuel("92号汽油", 3000);
      expect(refilled.currentStock).toBe(8000);
    });

    it("拒绝补充量超出容量", () => {
      station.addFuelType("92号汽油", 7.89, 10000, 9000);
      expect(() => station.refillFuel("92号汽油", 2000)).toThrow("超出容量");
    });

    it("返回所有燃油状态", () => {
      station.addFuelType("92号汽油", 7.89, 10000);
      station.addFuelType("95号汽油", 8.49, 8000);
      expect(station.getFuelStatus()).toHaveLength(2);
    });
  });

  describe("油枪管理", () => {
    beforeEach(() => {
      station.addFuelType("92号汽油", 7.89, 10000, 5000);
    });

    it("添加油枪", () => {
      const pump = station.addPump(1, "92号汽油");
      expect(pump.id).toBe(1);
      expect(pump.status).toBe("空闲");
      expect(pump.assignedFuel).toBe("92号汽油");
    });

    it("拒绝重复的油枪编号", () => {
      station.addPump(1, "92号汽油");
      expect(() => station.addPump(1, "92号汽油")).toThrow("已存在");
    });

    it("拒绝未知燃油类型的油枪", () => {
      expect(() => station.addPump(1, "氢气")).toThrow("不存在");
    });

    it("设置油枪状态", () => {
      station.addPump(1, "92号汽油");
      const updated = station.setPumpStatus(1, "故障");
      expect(updated.status).toBe("故障");
    });

    it("筛选空闲油枪", () => {
      station.addPump(1, "92号汽油");
      station.addPump(2, "92号汽油");
      station.setPumpStatus(2, "故障");
      expect(station.getAvailablePumps()).toHaveLength(1);
    });
  });

  describe("交易管理", () => {
    beforeEach(() => {
      station.addFuelType("92号汽油", 7.89, 10000, 5000);
      station.addPump(1, "92号汽油");
    });

    it("处理加油交易", () => {
      const txn = station.sellFuel(1, 10);
      expect(txn.liters).toBe(10);
      expect(txn.total).toBe(78.9);
      expect(txn.fuelType).toBe("92号汽油");
      expect(txn.id).toMatch(/^TXN-/);
    });

    it("售后减少燃油库存", () => {
      station.sellFuel(1, 100);
      const fuels = station.getFuelStatus();
      expect(fuels[0].currentStock).toBe(4900);
    });

    it("拒绝在不可用油枪上交易", () => {
      station.setPumpStatus(1, "故障");
      expect(() => station.sellFuel(1, 10)).toThrow("故障");
    });

    it("拒绝超出库存的交易", () => {
      expect(() => station.sellFuel(1, 6000)).toThrow("燃油不足");
    });

    it("拒绝非正数升数", () => {
      expect(() => station.sellFuel(1, 0)).toThrow("必须为正数");
    });

    it("按时间倒序返回交易记录", () => {
      station.sellFuel(1, 5);
      station.sellFuel(1, 10);
      const txns = station.getTransactions();
      expect(txns[0].liters).toBe(10);
      expect(txns[1].liters).toBe(5);
    });

    it("限制返回的交易记录数量", () => {
      station.sellFuel(1, 5);
      station.sellFuel(1, 10);
      station.sellFuel(1, 15);
      expect(station.getTransactions(2)).toHaveLength(2);
    });
  });

  describe("员工管理", () => {
    it("添加员工", () => {
      const emp = station.addEmployee("E001", "张伟", "经理");
      expect(emp.id).toBe("E001");
      expect(emp.onShift).toBe(false);
    });

    it("拒绝重复的员工编号", () => {
      station.addEmployee("E001", "张伟", "经理");
      expect(() => station.addEmployee("E001", "李娜", "加油员")).toThrow("已存在");
    });

    it("上班打卡和下班打卡", () => {
      station.addEmployee("E001", "张伟", "经理");
      station.clockIn("E001");
      expect(station.getOnShiftEmployees()).toHaveLength(1);
      station.clockOut("E001");
      expect(station.getOnShiftEmployees()).toHaveLength(0);
    });

    it("拒绝重复上班打卡", () => {
      station.addEmployee("E001", "张伟", "经理");
      station.clockIn("E001");
      expect(() => station.clockIn("E001")).toThrow("已在班中");
    });

    it("拒绝未上班时下班打卡", () => {
      station.addEmployee("E001", "张伟", "经理");
      expect(() => station.clockOut("E001")).toThrow("不在班");
    });
  });

  describe("报表", () => {
    it("生成完整报表", () => {
      station.addFuelType("92号汽油", 7.89, 10000, 5000);
      station.addFuelType("95号汽油", 8.49, 8000, 800);
      station.addPump(1, "92号汽油");
      station.sellFuel(1, 10);
      station.sellFuel(1, 20);

      const report = station.generateReport();
      expect(report.totalRevenue).toBe(236.7);
      expect(report.totalLitersSold).toBe(30);
      expect(report.transactionCount).toBe(2);
      expect(report.fuelLevels).toHaveLength(2);
      expect(report.lowStockAlerts).toHaveLength(1);
      expect(report.lowStockAlerts[0]).toContain("95号汽油");
    });

    it("新加油站返回空报表", () => {
      const report = station.generateReport();
      expect(report.totalRevenue).toBe(0);
      expect(report.transactionCount).toBe(0);
      expect(report.lowStockAlerts).toHaveLength(0);
    });
  });
});
