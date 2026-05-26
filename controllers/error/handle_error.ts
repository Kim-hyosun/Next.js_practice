import { NextApiResponse } from 'next';
import CustomServerError from './custom_server_error';

const handleError = (err: unknown, res: NextApiResponse) => {
  const customError =
    err instanceof CustomServerError ? err : new CustomServerError({ statusCode: 500, message: 'unknown Error' });

  if (customError.location) {
    res.setHeader('location', customError.location);
  }
  res.status(customError.statusCode).send(customError.serializeErrors());
};

export default handleError;
