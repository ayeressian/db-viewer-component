const puppeteer = require('puppeteer');
const schoolSchema = require('../example/schema/school.json');
const expect = require('chai').expect;

const SHADOW_ROOT_QUERY = `document.querySelector('db-designer').shadowRoot`;

describe('db-designer', () => {
  let page;
  let browser;

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
      shadowRoot = await page.evaluateHandle(SHADOW_ROOT_QUERY);
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
        tables = await shadowRoot.$$('#designer foreignObject');
      });

      it('needs to be rendered', () => {
        expect(designer).to.not.be.null;
      });

      it('should have correct number of tables', () => {
        expect(tables.length).to.equal(schoolSchema.tables.length);
      });
    });
  });

  after(async () => {
    await browser.close();
  });
});
