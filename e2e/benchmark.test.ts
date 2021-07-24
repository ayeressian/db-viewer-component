import { test, expect } from "@playwright/test";
import benchmarkSchema from "../example/schema/benchmark.json";
import { getNumberOfTables, initTest } from "./util";

const { describe } = test;

describe("benchmark db-viewer", () => {
  initTest();
  test("should show correct number of tables", async ({ page }) => {
    const tables = await page.$$("#benchmark table");
    expect(tables.length).toBe(getNumberOfTables(benchmarkSchema));
  });

  //Testing relation count is complicated. Since some of the relations are not rendered because tables overlap.
});
