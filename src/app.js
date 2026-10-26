import { SERVICE_MODELS, LAYERS, estimateMonthlyCost, formatUSD, whoManages } from "./lib.js";

// ---- Responsibility matrix -------------------------------------------------
function renderModelsTable() {
  const table = document.getElementById("models-table");
  const modelKeys = Object.keys(SERVICE_MODELS);

  const head = document.createElement("tr");
  head.append(cell("th", "Layer"));
  for (const key of modelKeys) head.append(cell("th", SERVICE_MODELS[key].label));
  table.append(head);

  for (const layer of LAYERS) {
    const row = document.createElement("tr");
    row.append(cell("td", layer));
    for (const key of modelKeys) {
      const owner = whoManages(key, layer);
      const td = cell("td", owner === "you" ? "You" : "Provider");
      td.className = owner;
      row.append(td);
    }
    table.append(row);
  }
}

function cell(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

// ---- Cost calculator -------------------------------------------------------
function setupCalculator() {
  const form = document.getElementById("cost-form");
  const errorEl = document.getElementById("cost-error");
  const resultEl = document.getElementById("cost-result");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorEl.textContent = "";

    const data = new FormData(form);
    const cfg = {
      vcpus: Number(data.get("vcpus")),
      ramGb: Number(data.get("ramGb")),
      storageGb: Number(data.get("storageGb")),
      hoursPerMonth: Number(data.get("hoursPerMonth")),
    };

    try {
      const cost = estimateMonthlyCost(cfg);
      document.getElementById("r-compute").textContent = formatUSD(cost.compute);
      document.getElementById("r-memory").textContent = formatUSD(cost.memory);
      document.getElementById("r-storage").textContent = formatUSD(cost.storage);
      document.getElementById("r-total").textContent = formatUSD(cost.total);
      resultEl.hidden = false;
    } catch (err) {
      resultEl.hidden = true;
      errorEl.textContent = err.message;
    }
  });
}

// ---- Build info (written by scripts/build.js during CI) ---------------------
async function showBuildInfo() {
  const el = document.getElementById("build-info");
  try {
    const res = await fetch("build-info.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.statusText);
    const info = await res.json();
    const when = new Date(info.builtAt).toLocaleString();
    el.textContent = `Deployed commit ${info.commitShort} on ${when} (${info.environment})`;
  } catch {
    el.textContent = "Local preview, no build info available.";
  }
}

renderModelsTable();
setupCalculator();
showBuildInfo();
