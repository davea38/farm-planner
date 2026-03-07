/**
 * Verify task 12.6: Export/Import cycle
 * Tests that export → clear → import restores all data correctly.
 *
 * Since exportToFile/importFromFile use browser APIs (Blob, FileReader, localStorage),
 * we test the underlying serialization + validation + migration logic directly.
 */

import assert from "node:assert";

// ─── Inline the core logic from storage.ts (no browser APIs) ───

const CURRENT_VERSION = 1;

function hasValidStructure(data) {
  if (typeof data !== "object" || data === null) return false;
  return (
    typeof data.costPerHectare === "object" &&
    data.costPerHectare !== null &&
    typeof data.costPerHour === "object" &&
    data.costPerHour !== null &&
    typeof data.compareMachines === "object" &&
    data.compareMachines !== null &&
    typeof data.replacementPlanner === "object" &&
    data.replacementPlanner !== null
  );
}

function isValidState(data) {
  if (!hasValidStructure(data)) return false;
  return typeof data.version === "number" && typeof data.lastSaved === "string";
}

const migrations = [
  (state) => ({
    ...state,
    version: 1,
    lastSaved: state.lastSaved ?? new Date().toISOString(),
  }),
];

function migrateState(data) {
  const fromVersion = typeof data.version === "number" ? data.version : 0;
  if (fromVersion > CURRENT_VERSION) return null;
  if (fromVersion === CURRENT_VERSION) return data;
  let migrated = { ...data };
  for (let v = fromVersion; v < CURRENT_VERSION; v++) {
    const migrate = migrations[v];
    if (!migrate) return null;
    migrated = migrate(migrated);
  }
  return isValidState(migrated) ? migrated : null;
}

// Simulate localStorage as a plain object
let storage = {};

function saveState(state) {
  const toSave = {
    ...state,
    version: CURRENT_VERSION,
    lastSaved: new Date().toISOString(),
  };
  storage["farmPlanner"] = JSON.stringify(toSave);
}

function loadState(defaults) {
  const raw = storage["farmPlanner"];
  if (!raw) return defaults();
  try {
    const parsed = JSON.parse(raw);
    if (!hasValidStructure(parsed)) return defaults();
    const migrated = migrateState(parsed);
    if (!migrated) return defaults();
    return migrated;
  } catch {
    return defaults();
  }
}

function clearStorage() {
  storage = {};
}

// Simulate exportToFile: serialize state to JSON string
function exportToJson(state) {
  const toExport = {
    ...state,
    version: CURRENT_VERSION,
    lastSaved: new Date().toISOString(),
  };
  return JSON.stringify(toExport, null, 2);
}

// Simulate importFromFile: parse JSON, validate, save to storage
function importFromJson(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!hasValidStructure(parsed)) throw new Error("Invalid farm planner data file");
  const migrated = migrateState(parsed);
  if (!migrated) throw new Error("Unsupported data version");
  saveState(migrated);
  return migrated;
}

// ─── Test Data ───

function createTestState() {
  return {
    version: 1,
    lastSaved: new Date().toISOString(),
    costPerHectare: {
      current: {
        purchasePrice: 150000,
        yearsOwned: 10,
        salePrice: 45000,
        hectaresPerYear: 800,
        interestRate: 3,
        insuranceRate: 2.5,
        storageRate: 1.5,
        workRate: 5,
        labourCost: 16,
        fuelPrice: 0.65,
        fuelUse: 25,
        repairsPct: 3,
        contractorCharge: 85,
      },
      savedMachines: [
        {
          name: "John Deere 6R",
          inputs: {
            purchasePrice: 180000,
            yearsOwned: 6,
            salePrice: 90000,
            hectaresPerYear: 1500,
            interestRate: 2,
            insuranceRate: 2,
            storageRate: 1,
            workRate: 6,
            labourCost: 14,
            fuelPrice: 0.53,
            fuelUse: 22,
            repairsPct: 2.5,
            contractorCharge: 76,
          },
        },
      ],
    },
    costPerHour: {
      current: {
        purchasePrice: 110000,
        yearsOwned: 5,
        salePrice: 55000,
        hoursPerYear: 900,
        interestRate: 2.5,
        insuranceRate: 2,
        storageRate: 1,
        haPerHr: 5,
        fuelConsumptionPerHr: 18,
        fuelPrice: 0.62,
        repairsPct: 1.5,
        labourCost: 15,
        contractorCharge: 50,
      },
      savedMachines: [
        {
          name: "Fendt 724",
          inputs: {
            purchasePrice: 95000,
            yearsOwned: 8,
            salePrice: 35000,
            hoursPerYear: 600,
            interestRate: 2,
            insuranceRate: 2,
            storageRate: 1,
            haPerHr: 4,
            fuelConsumptionPerHr: 14,
            fuelPrice: 0.6,
            repairsPct: 1,
            labourCost: 14,
            contractorCharge: 45,
          },
        },
      ],
    },
    compareMachines: {
      machineA: {
        name: "Hardi Navigator",
        width: 24,
        capacity: 4000,
        speed: 8,
        applicationRate: 200,
        transportTime: 8,
        fillingTime: 15,
        fieldEfficiency: 70,
      },
      machineB: {
        name: "Bateman RB35",
        width: 36,
        capacity: 3500,
        speed: 12,
        applicationRate: 200,
        transportTime: 5,
        fillingTime: 12,
        fieldEfficiency: 80,
      },
    },
    replacementPlanner: {
      machines: [
        {
          id: "test-1",
          name: "Main Tractor",
          usePerYear: 800,
          timeToChange: 3,
          currentHours: 4500,
          priceToChange: 160000,
          currentValue: 55000,
        },
        {
          id: "test-2",
          name: "Combine",
          usePerYear: 200,
          timeToChange: 5,
          currentHours: 1200,
          priceToChange: 320000,
          currentValue: 120000,
        },
      ],
      farmIncome: 450000,
    },
  };
}

let passed = 0;

function check(description, condition) {
  assert.ok(condition, description);
  passed++;
}

// ─── Test 1: Basic export/import roundtrip ───

console.log("Test 1: Basic export/import roundtrip");
const original = createTestState();
saveState(original);

// Export
const exported = exportToJson(loadState(() => null));

// Clear localStorage
clearStorage();

// Verify state is gone
const afterClear = loadState(() => ({ cleared: true }));
check("Storage cleared successfully", afterClear.cleared === true);

// Import
const imported = importFromJson(exported);

// Verify all fields restored
check("version restored", imported.version === 1);
check("lastSaved is a string", typeof imported.lastSaved === "string");

// CostPerHectare current
check("cph purchasePrice", imported.costPerHectare.current.purchasePrice === 150000);
check("cph yearsOwned", imported.costPerHectare.current.yearsOwned === 10);
check("cph salePrice", imported.costPerHectare.current.salePrice === 45000);
check("cph hectaresPerYear", imported.costPerHectare.current.hectaresPerYear === 800);
check("cph interestRate", imported.costPerHectare.current.interestRate === 3);
check("cph workRate", imported.costPerHectare.current.workRate === 5);
check("cph labourCost", imported.costPerHectare.current.labourCost === 16);
check("cph fuelPrice", imported.costPerHectare.current.fuelPrice === 0.65);
check("cph repairsPct", imported.costPerHectare.current.repairsPct === 3);
check("cph contractorCharge", imported.costPerHectare.current.contractorCharge === 85);

// CostPerHectare saved machines
check("cph savedMachines length", imported.costPerHectare.savedMachines.length === 1);
check("cph saved name", imported.costPerHectare.savedMachines[0].name === "John Deere 6R");
check("cph saved purchasePrice", imported.costPerHectare.savedMachines[0].inputs.purchasePrice === 180000);

// CostPerHour current
check("cphr purchasePrice", imported.costPerHour.current.purchasePrice === 110000);
check("cphr hoursPerYear", imported.costPerHour.current.hoursPerYear === 900);
check("cphr fuelConsumptionPerHr", imported.costPerHour.current.fuelConsumptionPerHr === 18);
check("cphr contractorCharge", imported.costPerHour.current.contractorCharge === 50);

// CostPerHour saved machines
check("cphr savedMachines length", imported.costPerHour.savedMachines.length === 1);
check("cphr saved name", imported.costPerHour.savedMachines[0].name === "Fendt 724");

// CompareMachines
check("machineA name", imported.compareMachines.machineA.name === "Hardi Navigator");
check("machineA width", imported.compareMachines.machineA.width === 24);
check("machineA capacity", imported.compareMachines.machineA.capacity === 4000);
check("machineB name", imported.compareMachines.machineB.name === "Bateman RB35");
check("machineB width", imported.compareMachines.machineB.width === 36);
check("machineB speed", imported.compareMachines.machineB.speed === 12);

// ReplacementPlanner
check("rp machines length", imported.replacementPlanner.machines.length === 2);
check("rp machine 1 name", imported.replacementPlanner.machines[0].name === "Main Tractor");
check("rp machine 1 usePerYear", imported.replacementPlanner.machines[0].usePerYear === 800);
check("rp machine 1 timeToChange", imported.replacementPlanner.machines[0].timeToChange === 3);
check("rp machine 1 priceToChange", imported.replacementPlanner.machines[0].priceToChange === 160000);
check("rp machine 1 currentValue", imported.replacementPlanner.machines[0].currentValue === 55000);
check("rp machine 2 name", imported.replacementPlanner.machines[1].name === "Combine");
check("rp machine 2 priceToChange", imported.replacementPlanner.machines[1].priceToChange === 320000);
check("rp farmIncome", imported.replacementPlanner.farmIncome === 450000);

// Verify it's also persisted in storage
const reloaded = loadState(() => null);
check("reloaded from storage matches", reloaded.costPerHectare.current.purchasePrice === 150000);
check("reloaded farmIncome", reloaded.replacementPlanner.farmIncome === 450000);

console.log(`  ${passed} assertions passed`);

// ─── Test 2: Export/import with unversioned (v0) data ───

console.log("\nTest 2: Import unversioned (v0) exported data");
clearStorage();

const v0Data = { ...createTestState() };
delete v0Data.version;
delete v0Data.lastSaved;
const v0Json = JSON.stringify(v0Data, null, 2);

const importedV0 = importFromJson(v0Json);
check("v0 migrated to v1", importedV0.version === 1);
check("v0 has lastSaved", typeof importedV0.lastSaved === "string");
check("v0 data preserved", importedV0.costPerHectare.current.purchasePrice === 150000);
check("v0 replacement preserved", importedV0.replacementPlanner.farmIncome === 450000);

console.log(`  ${passed} assertions passed (cumulative)`);

// ─── Test 3: Import invalid data is rejected ───

console.log("\nTest 3: Import invalid data is rejected");

try {
  importFromJson("not json");
  check("should have thrown", false);
} catch (e) {
  check("rejects non-JSON", true);
}

try {
  importFromJson(JSON.stringify({ foo: "bar" }));
  check("should have thrown", false);
} catch (e) {
  check("rejects invalid structure", e.message === "Invalid farm planner data file");
}

try {
  const futureVersion = { ...createTestState(), version: 999 };
  importFromJson(JSON.stringify(futureVersion));
  check("should have thrown", false);
} catch (e) {
  check("rejects future version", e.message === "Unsupported data version");
}

console.log(`  ${passed} assertions passed (cumulative)`);

// ─── Test 4: Double export/import cycle ───

console.log("\nTest 4: Double export/import cycle preserves data");
clearStorage();

const state1 = createTestState();
state1.costPerHectare.current.purchasePrice = 200000;
saveState(state1);

const json1 = exportToJson(loadState(() => null));
clearStorage();
importFromJson(json1);

// Modify and export again
const loaded2 = loadState(() => null);
loaded2.replacementPlanner.farmIncome = 600000;
saveState(loaded2);

const json2 = exportToJson(loadState(() => null));
clearStorage();
const final = importFromJson(json2);

check("double cycle purchasePrice", final.costPerHectare.current.purchasePrice === 200000);
check("double cycle farmIncome", final.replacementPlanner.farmIncome === 600000);
check("double cycle saved machines", final.costPerHectare.savedMachines.length === 1);
check("double cycle machineA name", final.compareMachines.machineA.name === "Hardi Navigator");

console.log(`  ${passed} assertions passed (cumulative)`);

// ─── Test 5: Export JSON format is human-readable ───

console.log("\nTest 5: Export JSON format validation");
const exportedJson = exportToJson(createTestState());
const parsedExport = JSON.parse(exportedJson);
check("export is pretty-printed", exportedJson.includes("\n"));
check("export has version", parsedExport.version === 1);
check("export has lastSaved", typeof parsedExport.lastSaved === "string");
check("export has all 4 sections",
  "costPerHectare" in parsedExport &&
  "costPerHour" in parsedExport &&
  "compareMachines" in parsedExport &&
  "replacementPlanner" in parsedExport
);

console.log(`  ${passed} assertions passed (cumulative)`);

console.log(`\n=== ALL ${passed} ASSERTIONS PASSED ===`);
