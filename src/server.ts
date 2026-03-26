import express, { type Request, type Response } from "express";
import { GasStationManager } from "./gas-station-manager.js";

const app = express();
app.use(express.json());

const station = new GasStationManager("快捷加油站");

// 初始化数据
station.addFuelType("92号汽油", 7.89, 10000, 8000);
station.addFuelType("95号汽油", 8.49, 8000, 6000);
station.addFuelType("柴油", 7.59, 6000, 4500);

station.addPump(1, "92号汽油");
station.addPump(2, "92号汽油");
station.addPump(3, "95号汽油");
station.addPump(4, "柴油");

station.addEmployee("E001", "张伟", "经理");
station.addEmployee("E002", "李娜", "加油员");
station.addEmployee("E003", "王芳", "收银员");

// --- 燃油接口 ---

app.get("/api/fuels", (_req: Request, res: Response) => {
  res.json({ data: station.getFuelStatus() });
});

app.post("/api/fuels", (req: Request, res: Response) => {
  try {
    const { name, pricePerLiter, maxCapacity, initialStock } = req.body;
    const fuel = station.addFuelType(name, pricePerLiter, maxCapacity, initialStock);
    res.status(201).json({ data: fuel });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.put("/api/fuels/:name/price", (req: Request, res: Response) => {
  try {
    const name = String(req.params.name);
    const fuel = station.updateFuelPrice(name, req.body.pricePerLiter);
    res.json({ data: fuel });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.post("/api/fuels/:name/refill", (req: Request, res: Response) => {
  try {
    const name = String(req.params.name);
    const fuel = station.refillFuel(name, req.body.liters);
    res.json({ data: fuel });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// --- 油枪接口 ---

app.get("/api/pumps", (_req: Request, res: Response) => {
  res.json({ data: station.getAllPumps() });
});

app.get("/api/pumps/available", (_req: Request, res: Response) => {
  res.json({ data: station.getAvailablePumps() });
});

app.post("/api/pumps", (req: Request, res: Response) => {
  try {
    const pump = station.addPump(req.body.id, req.body.assignedFuel);
    res.status(201).json({ data: pump });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.put("/api/pumps/:id/status", (req: Request, res: Response) => {
  try {
    const pump = station.setPumpStatus(Number(req.params.id), req.body.status);
    res.json({ data: pump });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// --- 交易接口 ---

app.get("/api/transactions", (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  res.json({ data: station.getTransactions(limit) });
});

app.post("/api/sell", (req: Request, res: Response) => {
  try {
    const txn = station.sellFuel(req.body.pumpId, req.body.liters);
    res.status(201).json({ data: txn });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// --- 员工接口 ---

app.get("/api/employees/on-shift", (_req: Request, res: Response) => {
  res.json({ data: station.getOnShiftEmployees() });
});

app.post("/api/employees", (req: Request, res: Response) => {
  try {
    const emp = station.addEmployee(req.body.id, req.body.name, req.body.role);
    res.status(201).json({ data: emp });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.post("/api/employees/:id/clock-in", (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const log = station.clockIn(id);
    res.json({ data: log });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.post("/api/employees/:id/clock-out", (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const log = station.clockOut(id);
    res.json({ data: log });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// --- 报表接口 ---

app.get("/api/report", (_req: Request, res: Response) => {
  res.json({ data: station.generateReport() });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`加油站管理系统已启动：http://localhost:${PORT}`);
  console.log("\n可用接口：");
  console.log("  GET    /api/fuels              - 查看所有燃油");
  console.log("  POST   /api/fuels              - 添加燃油类型");
  console.log("  PUT    /api/fuels/:name/price   - 更新燃油价格");
  console.log("  POST   /api/fuels/:name/refill  - 补充燃油");
  console.log("  GET    /api/pumps              - 查看所有油枪");
  console.log("  GET    /api/pumps/available     - 查看空闲油枪");
  console.log("  POST   /api/pumps              - 添加油枪");
  console.log("  PUT    /api/pumps/:id/status    - 更新油枪状态");
  console.log("  POST   /api/sell               - 加油交易");
  console.log("  GET    /api/transactions        - 查看交易记录");
  console.log("  GET    /api/employees/on-shift  - 查看在班员工");
  console.log("  POST   /api/employees           - 添加员工");
  console.log("  POST   /api/employees/:id/clock-in  - 上班打卡");
  console.log("  POST   /api/employees/:id/clock-out - 下班打卡");
  console.log("  GET    /api/report              - 生成报表");
});
