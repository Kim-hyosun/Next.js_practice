import { NextApiRequest, NextApiResponse } from 'next';
import MessageCtrl from '@/controllers/message.ctrl';

import handleError from '@/controllers/error/handle_error';

import checkSupportMethod from '@/controllers/error/check_support_method';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const supportMethod = ['POST'];
  try {
    checkSupportMethod(supportMethod, method);
    await MessageCtrl.postReply(req, res);
  } catch (err) {
    console.error(err);
    //에러처리
    handleError(err, res);
  }
}
