import { GasStationManager } from "./gas-station-manager.js";

const station = new GasStationManager("Quick Stop Gas");

// Set up fuel types
station.addFuelType("Regular", 3.49, 10000, 8000);
station.addFuelType("Premium", 4.29, 8000, 6000);
station.addFuelType("Diesel", 3.99, 6000, 4500);

// Set up pumps
station.addPump(1, "Regular");
station.addPump(2, "Regular");
station.addPump(3, "Premium");
station.addPump(4, "Diesel");

// Add employees
station.addEmployee("E001", "Alice Johnson", "manager");
station.addEmployee("E002", "Bob Smith", "attendant");
station.addEmployee("E003", "Carol Davis", "cashier");

// Clock in employees
station.clockIn("E001");
station.clockIn("E002");

// Process some sales
const sale1 = station.sellFuel(1, 12.5);
console.log(`Sale: ${sale1.id} - ${sale1.gallons}gal ${sale1.fuelType} = $${sale1.total}`);

const sale2 = station.sellFuel(3, 8.0);
console.log(`Sale: ${sale2.id} - ${sale2.gallons}gal ${sale2.fuelType} = $${sale2.total}`);

const sale3 = station.sellFuel(4, 25.0);
console.log(`Sale: ${sale3.id} - ${sale3.gallons}gal ${sale3.fuelType} = $${sale3.total}`);

// Generate report
const report = station.generateReport();
console.log("\n--- Station Report ---");
console.log(`Total Revenue: $${report.totalRevenue}`);
console.log(`Total Gallons Sold: ${report.totalGallonsSold}`);
console.log(`Transactions: ${report.transactionCount}`);
console.log("\nFuel Levels:");
for (const fuel of report.fuelLevels) {
  console.log(`  ${fuel.name}: ${fuel.level}gal (${fuel.percentage}%)`);
}
if (report.lowStockAlerts.length > 0) {
  console.log("\nAlerts:");
  for (const alert of report.lowStockAlerts) {
    console.log(`  WARNING: ${alert}`);
  }
}

console.log("\nOn-shift employees:");
for (const emp of station.getOnShiftEmployees()) {
  console.log(`  ${emp.name} (${emp.role})`);
}

console.log("\nAvailable pumps:");
for (const pump of station.getAvailablePumps()) {
  console.log(`  Pump #${pump.id} - ${pump.assignedFuel}`);
}
