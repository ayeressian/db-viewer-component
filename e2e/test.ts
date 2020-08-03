import { Browser, Page } from 'playwright';
import getBrowser from "./get-browser";
import schoolSchema from '../example/schema/school.json';
import benchmarkSchema from '../example/schema/benchmark.json';
import { ColumnFk } from '../src/types/Column';
import { Schema } from '../src/types/Schema';
import { Point } from '../src';

const getNumberOfTables = (schema: Schema): number => schema.tables.length;
const getNumberOfRelations = (schema: Schema): number => {
  return schema.tables.reduce((acc, {columns}) => {
    acc += columns.reduce((accColumns, column) => {
      if ((column as ColumnFk).fk) ++accColumns;
      return accColumns;
    }, 0);
    return acc;
  }, 0);
};

describe('New file', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await getBrowser();

    page = await browser.newPage();
    await page.goto('http://localhost:9998/');
    await page.waitForLoadState('domcontentloaded');
  });
  
  afterAll(async () => {
    await page.close();
    await browser.close();
  });

  describe('school db-viewer', () => {
    it('should show correct number of tables', async () => {
      const tables = await page.$$('#school-db table');
      expect(tables.length).toBe(getNumberOfTables(schoolSchema));
    });

    it('should show correct number of relations', async () => {
      const paths = await page.$$('#school-db path.highlight');
      expect(paths.length).toBe(getNumberOfRelations(schoolSchema));
    });

    describe('school table', () => {
      const schoolTableSchema = (schoolSchema as Schema).tables[0];
      it ('should have correct title', async () => {
        const tableHeader = await page.$('#school-db #\\30table th');
        const title = await tableHeader!.innerHTML();
        expect(title).toBe(schoolTableSchema.name);
      });

      it ('should have correct number of rows (column representation)', async () => {
        const tableRows = await page.$$('#school-db #\\30table tr');
        // minus 1 because of title
        expect(tableRows.length - 1).toBe(schoolTableSchema.columns.length);
      });

      it ('should have correct cordinates', async () => {
        const foreignObject = await page.$('#school-db #\\30table foreignObject');
        const pos = (schoolTableSchema.pos as Point);
        const xAttr = await foreignObject!.getAttribute('x');
        const yAttr = await foreignObject!.getAttribute('y');
        expect(Number(xAttr)).toBe(pos.x);
        expect(Number(yAttr)).toBe(pos.y);
      });
    });
  });

  describe('benchmark db-viewer', () => {
    it('should show correct number of tables', async () => {
      const tables = await page.$$('#benchmark table');
      expect(tables.length).toBe(getNumberOfTables(benchmarkSchema));
    });

    //Testing relation count is complicated. Since some of the relations are not rendered because tables overlap.
  });

});
