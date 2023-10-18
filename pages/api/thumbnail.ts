// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import playwright from 'playwright-core';
import { NextApiRequest, NextApiResponse } from 'next';
import Chromium from 'chrome-aws-lambda';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const localChromePath = process.env.NODE_ENV !== 'development' ? '' : process.env.LOCAL_CHROME_PATH ?? '';

  if (process.env.NODE_ENV !== 'development') {
    const protocol = process.env.PROTOCOL || 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '3000';
    const baseUrl = `${protocol}://${host}:${port}`;

    await Chromium.font(`${baseUrl}/Pretendard-Regular.ttf`);
  }

  const browser = await playwright.chromium.launch({
    args: Chromium.args,
    executablePath: process.env.NODE_ENV !== 'development' ? await Chromium.executablePath : localChromePath,
    headless: process.env.NODE_ENV !== 'development' ? Chromium.headless : true,
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
