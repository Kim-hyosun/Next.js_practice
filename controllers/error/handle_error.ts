import { NextApiResponse } from 'next';
import CustomServeError from './custom_serve_error';

const handleError = (err: unknown, res: NextApiResponse) => {
  const customError =
    err instanceof CustomServeError ? err : new CustomServeError({ statusCode: 500, message: 'unknown Error' });

  if (customError.location) {
    res.setHeader('location', customError.location);
  }
  res.status(customError.statusCode).send(customError.serializeErrors());
};

export default handleError;
