import { NextApiResponse } from 'next';
import CustomServeError from './custom_serve_error';

const handleError = (err: unknown, res: NextApiResponse) => {
  let unknownError = err;
  if (err instanceof CustomServeError === false) {
    //커스텀서버에 있는 에러가 아니면
    unknownError = new CustomServeError({ statusCode: 499, message: 'unknown Error' });
  }

  const customError = unknownError as CustomServeError;
  res
    .status(customError.statusCode)
    .setHeader('location', customError.location ?? '')
    .send(customError.serializeErrors()); //에러응답에 body전달
};

export default handleError;
