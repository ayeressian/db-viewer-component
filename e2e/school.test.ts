import { test, expect } from "@playwright/test";
import { Schema } from "../src/types/schema";
import schoolSchema from "../example/schema/school.json";
import Point from "../src/types/point";
import { getNumberOfRelations, getNumberOfTables, initTest } from "./util";

const { describe, beforeEach } = test;

describe("school example", () => {
  initTest();

  describe("relations", () => {
    test("it should show correct number of relations", async ({ page }) => {
      const paths = await page.$$("#school-db path.highlight");
      expect(paths.length).toBe(getNumberOfRelations(schoolSchema));
    });
  });

  describe("annotations", () => {
    const schemaAnnots = schoolSchema.annotations;
    const firstSchAnnot = schemaAnnots[0];
    test("it should render correct number of annotations", async ({ page }) => {
      const annotations = await page.$$("#school-db g.annotation");
      expect(annotations.length).toBe(schemaAnnots.length);
    });

    test("should have correct title", async ({ page }) => {
      const h1 = await page.$("#school-db g.annotation h1");
      expect(await h1?.innerText()).toBe(firstSchAnnot.title);
    });

    test("should have correct text", async ({ page }) => {
      const p = await page.$("#school-db g.annotation p");
      expect(await p?.innerText()).toBe(firstSchAnnot.text);
    });

    test("should have correct pos", async ({ page }) => {
      const fo = await page.$("#school-db g.annotation foreignObject");
      const x = (await fo?.getAttribute("x"))!;
      const xNum = parseInt(x);
      const y = (await fo?.getAttribute("y"))!;
      const yNum = parseInt(y);
      expect(xNum).toBe(firstSchAnnot.pos.x);
      expect(yNum).toBe(firstSchAnnot.pos.y);
    });

    test("should have correct size", async ({ page }) => {
      const fo = await page.$("#school-db g.annotation foreignObject");
      const width = (await fo?.getAttribute("width"))!;
      const widthNum = parseInt(width);
      const height = (await fo?.getAttribute("height"))!;
      const heightNum = parseInt(height);
      expect(widthNum).toBe(firstSchAnnot.width);
      expect(heightNum).toBe(firstSchAnnot.height);
    });

    describe("when table is moved", () => {
      test.fixme();
      beforeEach(async ({ page }) => {
        const annotation = await page.$("#school-db g.annotation .annotation");
        await annotation?.hover();
        await page.mouse.down();
        await page.mouse.move(100, 200);
        await page.mouse.up();
      });

      test("should have correct pos", async ({ page }) => {
        const fos = await page.$$("#school-db g.annotation foreignObject");
        const fo = fos[fos.length - 1];
        const x = (await fo?.getAttribute("x"))!;
        const xNum = parseInt(x);
        const y = (await fo?.getAttribute("y"))!;
        const yNum = parseInt(y);
        expect(xNum).toBe(firstSchAnnot.pos.x);
        expect(yNum).toBe(firstSchAnnot.pos.y);
      });
    });
  });

  describe("tables", () => {
    test("it should render correct number of tables", async ({ page }) => {
      const tables = await page.$$("#school-db table");
      expect(tables.length).toBe(getNumberOfTables(schoolSchema));
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
        const foreignObject = await page.$(
          "#school-db #\\30table foreignObject"
        );
        const pos = schoolTableSchema.pos as Point;
        const xAttr = await foreignObject!.getAttribute("x");
        const yAttr = await foreignObject!.getAttribute("y");
        expect(Number(xAttr)).toBe(pos.x);
        expect(Number(yAttr)).toBe(pos.y);
      });
    });
  });
});
