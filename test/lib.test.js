import { test } from "node:test";
import assert from "node:assert/strict";
import {
  estimateMonthlyCost,
  formatUSD,
  whoManages,
  SERVICE_MODELS,
  LAYERS,
  MAX_HOURS_PER_MONTH,
} from "../src/lib.js";

test("estimateMonthlyCost: typical 2 vCPU / 4 GB / 50 GB VM for 730 hours", () => {
  const cost = estimateMonthlyCost({ vcpus: 2, ramGb: 4, storageGb: 50, hoursPerMonth: 730 });
  assert.equal(cost.compute, 29.2); // 2 * 0.02 * 730
  assert.equal(cost.memory, 14.6); // 4 * 0.005 * 730
  assert.equal(cost.storage, 5); // 50 * 0.10
  assert.equal(cost.total, 48.8);
});

test("estimateMonthlyCost: zero usage costs only nothing", () => {
  const cost = estimateMonthlyCost({ vcpus: 0, ramGb: 0, storageGb: 0, hoursPerMonth: 0 });
  assert.equal(cost.total, 0);
});

test("estimateMonthlyCost: storage is billed even if the VM is switched off", () => {
  const cost = estimateMonthlyCost({ vcpus: 4, ramGb: 8, storageGb: 100, hoursPerMonth: 0 });
  assert.equal(cost.compute, 0);
  assert.equal(cost.memory, 0);
  assert.equal(cost.storage, 10);
  assert.equal(cost.total, 10);
});

test("estimateMonthlyCost: rejects negative, NaN and non-number input", () => {
  const ok = { vcpus: 1, ramGb: 1, storageGb: 1, hoursPerMonth: 1 };
  assert.throws(() => estimateMonthlyCost({ ...ok, vcpus: -1 }), RangeError);
  assert.throws(() => estimateMonthlyCost({ ...ok, ramGb: NaN }), RangeError);
  assert.throws(() => estimateMonthlyCost({ ...ok, storageGb: "10" }), RangeError);
  assert.throws(() => estimateMonthlyCost({ ...ok, hoursPerMonth: Infinity }), RangeError);
});

test("estimateMonthlyCost: rejects more hours than exist in a month", () => {
  const cfg = { vcpus: 1, ramGb: 1, storageGb: 1, hoursPerMonth: MAX_HOURS_PER_MONTH + 1 };
  assert.throws(() => estimateMonthlyCost(cfg), /cannot exceed/);
});

test("formatUSD formats currency with two decimals", () => {
  assert.equal(formatUSD(48.8), "$48.80");
  assert.equal(formatUSD(0), "$0.00");
});

test("whoManages: SaaS hands every layer to the provider", () => {
  for (const layer of LAYERS) assert.equal(whoManages("saas", layer), "provider");
});

test("whoManages: on-premises means you manage every layer", () => {
  for (const layer of LAYERS) assert.equal(whoManages("onPrem", layer), "you");
});

test("whoManages: IaaS vs PaaS boundary", () => {
  assert.equal(whoManages("iaas", "OS"), "you");
  assert.equal(whoManages("paas", "OS"), "provider");
  assert.equal(whoManages("paas", "Applications"), "you");
});

test("whoManages: unknown model or layer throws", () => {
  assert.throws(() => whoManages("faas", "OS"), /Unknown service model/);
  assert.throws(() => whoManages("iaas", "Cooling"), /Unknown layer/);
});

test("every managed layer in SERVICE_MODELS is a known layer", () => {
  for (const model of Object.values(SERVICE_MODELS)) {
    for (const layer of model.managedByYou) assert.ok(LAYERS.includes(layer), layer);
  }
});
