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
      shadowRoot = await page.evaluateHandle(() => {
        return document.querySelector('db-designer').shadowRoot;
      });
    });

    it('#minimap needs to be rendered', async () => {
      const result = await shadowRoot.$('#minimap');
      expect(result).to.not.be.null;
    });

    describe('#designer', () => {
      let tables;
      let designer;

      const getTables = () => {
        return shadowRoot.$$('#designer foreignObject table');
      };

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

      describe('#table', () => {
        it('should move on click and drag by exact amount', async () => {
          const clickedTable = tables[2];
          const amountX = 100;
          const amountY = 100;
          const beforeCord = await clickedTable.boundingBox();
          await mouseDragElement(clickedTable, amountX, amountY);
          const afterCord = await clickedTable.boundingBox();

          expect(Math.round(afterCord.x - beforeCord.x)).to.equal(amountX);
          expect(Math.round(afterCord.y - beforeCord.y)).to.equal(amountY);
        });
      });
    });
  });

  after(async () => {
    await browser.close();
  });
});
