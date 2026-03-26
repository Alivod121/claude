import { GasStationManager } from "./gas-station-manager.js";

const station = new GasStationManager("快捷加油站");

// 设置燃油类型
station.addFuelType("92号汽油", 7.89, 10000, 8000);
station.addFuelType("95号汽油", 8.49, 8000, 6000);
station.addFuelType("柴油", 7.59, 6000, 4500);

// 设置油枪
station.addPump(1, "92号汽油");
station.addPump(2, "92号汽油");
station.addPump(3, "95号汽油");
station.addPump(4, "柴油");

// 添加员工
station.addEmployee("E001", "张伟", "经理");
station.addEmployee("E002", "李娜", "加油员");
station.addEmployee("E003", "王芳", "收银员");

// 员工上班打卡
station.clockIn("E001");
station.clockIn("E002");

// 处理加油交易
const sale1 = station.sellFuel(1, 40);
console.log(`交易：${sale1.id} - ${sale1.liters}升 ${sale1.fuelType} = ¥${sale1.total}`);

const sale2 = station.sellFuel(3, 30);
console.log(`交易：${sale2.id} - ${sale2.liters}升 ${sale2.fuelType} = ¥${sale2.total}`);

const sale3 = station.sellFuel(4, 80);
console.log(`交易：${sale3.id} - ${sale3.liters}升 ${sale3.fuelType} = ¥${sale3.total}`);

// 生成报表
const report = station.generateReport();
console.log("\n--- 加油站报表 ---");
console.log(`总营收：¥${report.totalRevenue}`);
console.log(`总销售量：${report.totalLitersSold}升`);
console.log(`交易次数：${report.transactionCount}`);
console.log("\n燃油库存：");
for (const fuel of report.fuelLevels) {
  console.log(`  ${fuel.name}：${fuel.level}升（${fuel.percentage}%）`);
}
if (report.lowStockAlerts.length > 0) {
  console.log("\n库存警报：");
  for (const alert of report.lowStockAlerts) {
    console.log(`  警告：${alert}`);
  }
}

console.log("\n在班员工：");
for (const emp of station.getOnShiftEmployees()) {
  console.log(`  ${emp.name}（${emp.role}）`);
}

console.log("\n空闲油枪：");
for (const pump of station.getAvailablePumps()) {
  console.log(`  ${pump.id}号油枪 - ${pump.assignedFuel}`);
}
