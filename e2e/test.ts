import { Browser, ElementHandle, Page } from "playwright";
import getBrowser from "./get-browser";
import schoolSchema from "../example/schema/school.json";
import benchmarkSchema from "../example/schema/benchmark.json";
import { ColumnFk } from "../src/types/column";
import { Schema } from "../src/types/schema";
import { Point } from "../src";

const getNumberOfTables = (schema: Schema): number => schema.tables.length;
const getNumberOfAnnotations = (schema: Schema): number =>
  schema.annotations!.length;
const getNumberOfRelations = (schema: Schema): number => {
  return schema.tables.reduce((acc, { columns }) => {
    acc += columns.reduce((accColumns, column) => {
      if ((column as ColumnFk).fk) ++accColumns;
      return accColumns;
    }, 0);
    return acc;
  }, 0);
};

describe("New file", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await getBrowser();

    page = await browser.newPage();
    await page.goto("http://localhost:9998/");
    await page.waitForLoadState("domcontentloaded");
  });

  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  describe("school db-viewer", () => {
    it("should show correct number of tables", async () => {
      const tables = await page.$$("#school-db table");
      expect(tables.length).toBe(getNumberOfTables(schoolSchema));
    });

    it("should show correct number of relations", async () => {
      const paths = await page.$$("#school-db path.highlight");
      expect(paths.length).toBe(getNumberOfRelations(schoolSchema));
    });

    describe("annotation", () => {
      it("should render correct number of annotations", async () => {
        const annotations = await page.$$("#school-db g.annotation");
        expect(annotations.length).toBe(getNumberOfAnnotations(schoolSchema));
      });

      it("should have correct title", async () => {
        const h1 = await page.$("#school-db g.annotation h1");
        const title = await h1?.innerText();
        expect(title).toBe(schoolSchema.annotations[0].title);
      });

      it("should have correct text", async () => {
        const p = await page.$("#school-db g.annotation p");
        const text = await p?.innerText();
        expect(text).toBe(schoolSchema.annotations[0].text);
      });

      it("should have correct position", async () => {
        const fo = await page.$("#school-db g.annotation foreignObject");
        const x = await fo?.getAttribute("x");
        const numX = parseInt(x!, 0);
        const y = await fo?.getAttribute("y");
        const numY = parseInt(y!, 0);
        expect(numX).toBe(schoolSchema.annotations[0].pos.x);
        expect(numY).toBe(schoolSchema.annotations[0].pos.y);
      });

      it("should have correct size", async () => {
        const fo = await page.$("#school-db g.annotation foreignObject");
        const height = await fo?.getAttribute("height");
        const numHeight = parseInt(height!, 0);
        const width = await fo?.getAttribute("width");
        const numWidth = parseInt(width!, 0);
        expect(numHeight).toBe(schoolSchema.annotations[0].height);
        expect(numWidth).toBe(schoolSchema.annotations[0].width);
      });

    //   describe("when annotation is moved", () => {
    //     let fo: ElementHandle<SVGElement | HTMLElement>;
    //     beforeAll(async () => {
    //       fo = (await page.$("#school-db g.annotation foreignObject"))!;
    //       await fo.hover({
    //         position: {
    //           x: 50,
    //           y: 50,
    //         },
    //       });
    //       await page.mouse.down();
    //       await page.mouse.move(100, 150);
    //       await page.mouse.up();
    //     });
    //     it("should have correct possition", async () => {
    //       const x = await fo?.getAttribute("x");
    //       const numX = parseInt(x!, 0);
    //       const y = await fo?.getAttribute("y");
    //       const numY = parseInt(y!, 0);
    //       expect(numX).toBe(schoolSchema.annotations[0].pos.x + 100);
    //       expect(numY).toBe(schoolSchema.annotations[0].pos.y + 150);
    //     });
    //   });
    // });

    describe("school table", () => {
      const schoolTableSchema = (schoolSchema as Schema).tables[0];
      it("should have correct title", async () => {
        const tableHeader = await page.$("#school-db #\\30table th");
        const title = await tableHeader!.innerHTML();
        expect(title).toBe(schoolTableSchema.name);
      });

      it("should have correct number of rows (column representation)", async () => {
        const tableRows = await page.$$("#school-db #\\30table tr");
        // minus 1 because of title
        expect(tableRows.length - 1).toBe(schoolTableSchema.columns.length);
      });

      it("should have correct cordinates", async () => {
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

  describe("benchmark db-viewer", () => {
    it("should show correct number of tables", async () => {
      const tables = await page.$$("#benchmark table");
      expect(tables.length).toBe(getNumberOfTables(benchmarkSchema));
    });

    //Testing relation count is complicated. Since some of the relations are not rendered because tables overlap.
  });
});
