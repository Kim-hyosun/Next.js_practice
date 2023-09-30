import { NextApiRequest, NextApiResponse } from 'next';

import handleError from '@/controllers/error/handle_error';

import checkSupportMethod from '@/controllers/error/check_support_method';
import MessageCtrl from '@/controllers/message.ctrl';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const supportMethod = ['GET'];
  try {
    checkSupportMethod(supportMethod, method);
    await MessageCtrl.get(req, res);
  } catch (err) {
    console.error(err);
    //에러처리
    handleError(err, res);
  }
}
