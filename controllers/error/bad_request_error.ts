import CustomServeError from './custom_serve_error';

export default class BadReqError extends CustomServeError {
  constructor(message: string) {
    super({ statusCode: 400, message });
  }
}
