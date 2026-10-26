// Pure logic, no DOM access, so it can be unit-tested in Node and reused in the browser.

export const SERVICE_MODELS = {
  onPrem: {
    label: "On-premises",
    managedByYou: ["Applications", "Data", "Runtime", "Middleware", "OS", "Virtualization", "Servers", "Storage", "Networking"],
  },
  iaas: {
    label: "IaaS",
    managedByYou: ["Applications", "Data", "Runtime", "Middleware", "OS"],
  },
  paas: {
    label: "PaaS",
    managedByYou: ["Applications", "Data"],
  },
  saas: {
    label: "SaaS",
    managedByYou: [],
  },
};

export const LAYERS = [
  "Applications",
  "Data",
  "Runtime",
  "Middleware",
  "OS",
  "Virtualization",
  "Servers",
  "Storage",
  "Networking",
];

// Illustrative price list (USD). Not a real provider's pricing.
export const RATES = {
  vcpuPerHour: 0.02,
  ramGbPerHour: 0.005,
  storageGbPerMonth: 0.1,
};

export const MAX_HOURS_PER_MONTH = 744; // 31 days * 24 hours

function assertNonNegativeNumber(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative number`);
  }
}

/**
 * Estimate the monthly cost of a virtual machine.
 * @param {{vcpus:number, ramGb:number, storageGb:number, hoursPerMonth:number}} cfg
 * @returns {{compute:number, memory:number, storage:number, total:number}}
 */
export function estimateMonthlyCost({ vcpus, ramGb, storageGb, hoursPerMonth }) {
  assertNonNegativeNumber("vcpus", vcpus);
  assertNonNegativeNumber("ramGb", ramGb);
  assertNonNegativeNumber("storageGb", storageGb);
  assertNonNegativeNumber("hoursPerMonth", hoursPerMonth);
  if (hoursPerMonth > MAX_HOURS_PER_MONTH) {
    throw new RangeError(`hoursPerMonth cannot exceed ${MAX_HOURS_PER_MONTH}`);
  }

  const compute = vcpus * RATES.vcpuPerHour * hoursPerMonth;
  const memory = ramGb * RATES.ramGbPerHour * hoursPerMonth;
  const storage = storageGb * RATES.storageGbPerMonth;
  const round = (n) => Math.round(n * 100) / 100;

  return {
    compute: round(compute),
    memory: round(memory),
    storage: round(storage),
    total: round(compute + memory + storage),
  };
}

export function formatUSD(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

/**
 * Who manages a given layer under a given service model?
 * @returns {"you"|"provider"}
 */
export function whoManages(modelKey, layer) {
  const model = SERVICE_MODELS[modelKey];
  if (!model) throw new Error(`Unknown service model: ${modelKey}`);
  if (!LAYERS.includes(layer)) throw new Error(`Unknown layer: ${layer}`);
  return model.managedByYou.includes(layer) ? "you" : "provider";
}
