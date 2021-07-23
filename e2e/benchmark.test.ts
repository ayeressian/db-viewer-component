import { test, expect } from "@playwright/test";
import benchmarkSchema from "../example/schema/benchmark.json";
import { getNumberOfTables } from "./util";

const { describe, beforeEach } = test;

describe("benchmark db-viewer", () => {
  beforeEach(async ({ page }) => {
    await page.goto("http://localhost:9998");
    await page.waitForLoadState("domcontentloaded");
  });
  test("should show correct number of tables", async ({ page }) => {
    const tables = await page.$$("#benchmark table");
    expect(tables.length).toBe(getNumberOfTables(benchmarkSchema));
  });

  //Testing relation count is complicated. Since some of the relations are not rendered because tables overlap.
});