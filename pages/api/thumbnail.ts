import playwright from 'playwright-core';
import { NextApiRequest, NextApiResponse } from 'next';
import chromium from '@sparticuz/chromium';

const isDev = process.env.NODE_ENV === 'development';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const localChromePath = process.env.LOCAL_CHROME_PATH ?? '';

  if (!isDev) {
    const protocol = process.env.PROTOCOL || 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '3000';
    const baseUrl = `${protocol}://${host}:${port}`;

    await chromium.font(`${baseUrl}/Pretendard-Regular.ttf`);
  }

  const browser = await playwright.chromium.launch({
    args: chromium.args,
    executablePath: isDev ? localChromePath : await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage({
    viewport: {
      width: 1200,
      height: 675,
    },
  });

  const url = req.query.url as string;
  console.info({ url });
  await page.goto(url);

  const data = await page.screenshot({
    type: 'jpeg',
  });

  await browser.close();

  res.setHeader('Cache-Control', 's-maxage=31536000, public');
  res.setHeader('Content-Type', 'image/jpeg');
  res.end(data);
}
