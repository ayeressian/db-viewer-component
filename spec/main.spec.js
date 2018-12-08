/* global require, describe, beforeAll, it, expect, afterAll, jasmine */

const puppeteer = require('puppeteer');
const schoolSchema = require('../example/schema/school.json');

async function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

jasmine.getEnv().defaultTimeoutInterval = 20000;

const SHADOW_ROOT_QUERY = `document.querySelector('db-designer').shadowRoot`;

describe('Example', () => {
  let page;
  let browser;

  beforeAll(async (done) => {
    browser = await puppeteer.launch({
      headless: false
    });
    page = await browser.newPage();
    await page.goto('http://localhost:9998', {waitUntil: 'load'});
    // await timeout(3000);
    done();
  });

  it('should contain db-designer', async (done) => {
    const result = await page.$('db-designer');
    expect(result).not.toBeNull();
    done();
  });

  describe('in shadow root', () => {
    let shadowRoot;
    beforeAll(async (done) => {
      shadowRoot = await page.evaluateHandle(SHADOW_ROOT_QUERY);
      done();
    });

    it('#minimap needs to be rendered', async (done) => {
      const result = await shadowRoot.$('#minimap');
      expect(result).not.toBeNull();
      done();
    });

    describe('#designer', () => {
      let tables;
      let designer;
      beforeAll(async (done) => {
        designer = await shadowRoot.$('#designer');
        tables = await shadowRoot.$$('#designer foreignObject');
        done();
      });

      it('needs to be rendered', () => {
        expect(designer).not.toBeNull();
      });

      it('should have correct number of tables', () => {
        expect(tables.length).toBe(schoolSchema.tables.length);
      });
    });
  });

  afterAll(async (done) => {
    await browser.close();
    done();
  });
});
