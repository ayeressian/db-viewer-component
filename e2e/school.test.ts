// example.spec.ts
import { test, expect } from "@playwright/test";
import { Schema } from "../src/types/schema";
import schoolSchema from "../example/schema/school.json";
import Point from "../src/types/point";
import { getNumberOfRelations, getNumberOfTables } from "./util";

const { describe, beforeEach } = test;

describe("table", () => {
  beforeEach(async ({ page }) => {
    await page.goto("http://localhost:9998");
    await page.waitForLoadState("domcontentloaded");
  });

  test("it should render correct number of tables", async ({ page }) => {
    const tables = await page.$$("#school-db table");
    expect(tables.length).toBe(getNumberOfTables(schoolSchema));
  });

  test("should show correct number of relations", async ({ page }) => {
    const paths = await page.$$("#school-db path.highlight");
    expect(paths.length).toBe(getNumberOfRelations(schoolSchema));
  });

  describe("school table", () => {
    const schoolTableSchema = (schoolSchema as Schema).tables[0];
    test("should have correct title", async ({ page }) => {
      const tableHeader = await page.$("#school-db #\\30table th");
      const title = await tableHeader!.innerHTML();
      expect(title).toBe(schoolTableSchema.name);
    });

    test("should have correct number of rows (column representation)", async ({
      page,
    }) => {
      const tableRows = await page.$$("#school-db #\\30table tr");
      // minus 1 because of title
      expect(tableRows.length - 1).toBe(schoolTableSchema.columns.length);
    });

    test("should have correct cordinates", async ({ page }) => {
      const foreignObject = await page.$("#school-db #\\30table foreignObject");
      const pos = schoolTableSchema.pos as Point;
      const xAttr = await foreignObject!.getAttribute("x");
      const yAttr = await foreignObject!.getAttribute("y");
      expect(Number(xAttr)).toBe(pos.x);
      expect(Number(yAttr)).toBe(pos.y);
    });
  });
});
