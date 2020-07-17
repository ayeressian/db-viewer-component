import { firefox, webkit, chromium, Browser } from "playwright";

export default async function getBrowser(): Promise<Browser> {
  let browserType;
  switch(process.env.BROWSER_TYPE) {
    case 'firefox':
      browserType = firefox;
      break;
    case 'webkit':
      browserType = webkit;
      break;
    default: //'chromium'
      browserType = chromium;
      break;
  }
  return await browserType.launch({ headless: process.env.NO_HEADLESS !== 'true' });
}
