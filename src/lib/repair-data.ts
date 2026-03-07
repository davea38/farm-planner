export type MachineType =
  | "tractors"
  | "combines"
  | "trailedHarvesters"
  | "ploughs"
  | "rotaryCultivators"
  | "discHarrows"
  | "tedders"
  | "cerealDrills"
  | "grainDryers";

export interface MachineTypeInfo {
  label: string;
  type: MachineType;
}

export const machineTypes: MachineTypeInfo[] = [
  { label: "Tractors", type: "tractors" },
  { label: "Combine harvesters & SP harvesters", type: "combines" },
  { label: "Trailed harvesters & balers", type: "trailedHarvesters" },
  { label: "Ploughs, cultivators & toothed harrows", type: "ploughs" },
  { label: "Rotary cultivators & mowers", type: "rotaryCultivators" },
  { label: "Disc harrows, spreaders & sprayers", type: "discHarrows" },
  { label: "Tedders, unit drills & planters", type: "tedders" },
  { label: "Cereal drills & loaders", type: "cerealDrills" },
  { label: "Grain dryers, cleaners & rolls", type: "grainDryers" },
];

// Tractors use hour brackets 500/750/1000/1500
// All other machinery uses 50/100/150/200
// Each entry: [hours, percentage]
const tractorBrackets: [number, number][] = [
  [500, 3],
  [750, 3.5],
  [1000, 5],
  [1500, 7],
];

const standardBrackets: Record<
  Exclude<MachineType, "tractors">,
  { points: [number, number][]; perExtra100: number }
> = {
  combines: {
    points: [[50, 1.5], [100, 2.5], [150, 3.5], [200, 4.5]],
    perExtra100: 2,
  },
  trailedHarvesters: {
    points: [[50, 3], [100, 5], [150, 6], [200, 7]],
    perExtra100: 2,
  },
  ploughs: {
    points: [[50, 4.5], [100, 8], [150, 11], [200, 14]],
    perExtra100: 6,
  },
  rotaryCultivators: {
    points: [[50, 4], [100, 7], [150, 9.5], [200, 12]],
    perExtra100: 5,
  },
  discHarrows: {
    points: [[50, 3], [100, 5.5], [150, 7.5], [200, 9.5]],
    perExtra100: 4,
  },
  tedders: {
    points: [[50, 2.5], [100, 4.5], [150, 6.5], [200, 8.5]],
    perExtra100: 4,
  },
  cerealDrills: {
    points: [[50, 2], [100, 4], [150, 5.5], [200, 7]],
    perExtra100: 3,
  },
  grainDryers: {
    points: [[50, 1.5], [100, 2], [150, 2.5], [200, 3]],
    perExtra100: 0.5,
  },
};

// +0.5% per extra 100 hours beyond 1500 for tractors (derived from table pattern)
const tractorPerExtra100 = 0.5;

function interpolate(points: [number, number][], hours: number, perExtra100: number): number {
  if (hours <= points[0][0]) return points[0][1];

  const lastPoint = points[points.length - 1];
  if (hours >= lastPoint[0]) {
    const extraHours = hours - lastPoint[0];
    return lastPoint[1] + (extraHours / 100) * perExtra100;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const [h1, p1] = points[i];
    const [h2, p2] = points[i + 1];
    if (hours >= h1 && hours <= h2) {
      const ratio = (hours - h1) / (h2 - h1);
      return p1 + ratio * (p2 - p1);
    }
  }

  return lastPoint[1];
}

export function lookupRepairPct(machineType: MachineType, annualHours: number): number {
  if (annualHours <= 0) return 0;

  if (machineType === "tractors") {
    return interpolate(tractorBrackets, annualHours, tractorPerExtra100);
  }

  const data = standardBrackets[machineType];
  return interpolate(data.points, annualHours, data.perExtra100);
}
