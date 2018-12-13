const puppeteer = require('puppeteer');
const schoolSchema = require('../example/schema/school.json');
const expect = require('chai').expect;

const getInnerHtml = async (handle) => {
  return (await handle.getProperty('innerHTML')).jsonValue();
};

const wait = (time = 0) => {
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

describe('db-designer', () => {
  let page;
  let browser;

  const mouseDragElement = async (handle, x, y) => {
    const boundingBox = await handle.boundingBox();
    let mouseX = boundingBox.x + boundingBox.width / 2;
    let mouseY = boundingBox.y + boundingBox.height / 2;
    await page.mouse.move(mouseX, mouseY);
    await page.mouse.down();
    mouseX += x;
    mouseY += y;
    await page.mouse.move(mouseX, mouseY);
    await page.mouse.up();
  };

  const getShadowRoot = () => {
    return page.evaluateHandle(() => document.querySelector('db-designer').shadowRoot);
  };

  before(async () => {
    browser = await puppeteer.launch({
      headless: false
    });
    page = await browser.newPage();
    await page.goto('http://localhost:9998', {waitUntil: 'load'});
  });

  it('should contain db-designer', async () => {
    const result = await page.$('db-designer');
    expect(result).to.not.be.null;
  });

  describe('in shadow root', () => {
    let shadowRoot;

    before(async () => {
      shadowRoot = await getShadowRoot();
    });

    it('#minimap needs to be rendered', async () => {
      const result = await shadowRoot.$('#minimap');
      expect(result).to.not.be.null;
    });

    describe('#designer', () => {
      let tables;
      let designer;

      before(async () => {
        designer = await shadowRoot.$('#designer');
        tables = await shadowRoot.$$('#designer foreignObject table');
      });

      it('needs to be rendered', () => {
        expect(designer).to.not.be.null;
      });

      it('should have correct number of tables', () => {
        expect(tables.length).to.equal(schoolSchema.tables.length);
      });

      it('should show correct number of paths', async () => {
        await mouseDragElement(tables[2], 50, 1050);
        await mouseDragElement(tables[1], 550, 50);
        await mouseDragElement(tables[0], 50, 50);

        const count = schoolSchema.tables.reduce((result, table) => {
          return result + table.columns.reduce((result, column) => column.fk? result + 1: result, 0);
        }, 0);

        const paths = await designer.$$('path:not(.highlight)');

        expect(paths.length).equals(count);
      });

      describe('#table', () => {
        before(async () => {
          await page.reload({waitUntil: 'load'});
          shadowRoot = await getShadowRoot();
          tables = await shadowRoot.$$('#designer foreignObject table');
        });

        it('should move on click and drag by exact amount', async () => {
          const table = tables[2];
          const amountX = 100;
          const amountY = 100;
          const beforeCord = await table.boundingBox();
          await mouseDragElement(table, amountX, amountY);
          const afterCord = await table.boundingBox();

          expect(Math.round(afterCord.x - beforeCord.x)).to.equal(amountX);
          expect(Math.round(afterCord.y - beforeCord.y)).to.equal(amountY);
        });

        it('clicked one should be at the top of other tables', async () => {
          const clickedTable = tables[1];
          const amountX = 100;
          const amountY = 100;
          await mouseDragElement(clickedTable, amountX, amountY);

          const afterClickThs = await shadowRoot.$$('#designer foreignObject table th');

          const title = await getInnerHtml(afterClickThs[2]);
          expect(title).equal(schoolSchema.tables[1].name);
        });
      });
    });
  });

  after(async () => {
    await browser.close();
  });
});
