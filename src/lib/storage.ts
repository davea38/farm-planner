import { useEffect, useRef } from "react";
import type { AppState } from "./types";
import {
  defaultCostPerHectare,
  defaultCostPerHour,
  defaultMachineA,
  defaultMachineB,
  createDefaultReplacementMachines,
} from "./defaults";

const STORAGE_KEY = "farmPlanner";
const CURRENT_VERSION = 1;

function createDefaultState(): AppState {
  return {
    version: CURRENT_VERSION,
    lastSaved: new Date().toISOString(),
    costPerHectare: {
      current: { ...defaultCostPerHectare },
      savedMachines: [],
    },
    costPerHour: {
      current: { ...defaultCostPerHour },
      savedMachines: [],
    },
    compareMachines: {
      machineA: { ...defaultMachineA },
      machineB: { ...defaultMachineB },
    },
    replacementPlanner: {
      machines: createDefaultReplacementMachines(),
      farmIncome: 350000,
    },
  };
}

function isValidState(data: unknown): data is AppState {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.version === "number" &&
    typeof obj.lastSaved === "string" &&
    typeof obj.costPerHectare === "object" &&
    obj.costPerHectare !== null &&
    typeof obj.costPerHour === "object" &&
    obj.costPerHour !== null &&
    typeof obj.compareMachines === "object" &&
    obj.compareMachines !== null &&
    typeof obj.replacementPlanner === "object" &&
    obj.replacementPlanner !== null
  );
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();

    const parsed: unknown = JSON.parse(raw);
    if (!isValidState(parsed)) return createDefaultState();

    // Future: handle version migration here
    // if (parsed.version < CURRENT_VERSION) { migrate(parsed); }

    return parsed;
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: AppState): void {
  const toSave: AppState = {
    ...state,
    version: CURRENT_VERSION,
    lastSaved: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function exportToFile(state: AppState): void {
  const toExport: AppState = {
    ...state,
    version: CURRENT_VERSION,
    lastSaved: new Date().toISOString(),
  };
  const json = JSON.stringify(toExport, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `farm-planner-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useAutoSave(data: AppState, delayMs = 1000): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip saving on initial mount — the data is already from localStorage or defaults
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveState(data);
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, delayMs]);
}

export function importFromFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(reader.result as string);
        if (!isValidState(parsed)) {
          reject(new Error("Invalid farm planner data file"));
          return;
        }
        saveState(parsed);
        resolve(parsed);
      } catch {
        reject(new Error("Could not read file — is it a valid JSON export?"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
