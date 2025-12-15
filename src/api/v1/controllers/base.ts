import pino from 'pino';

export class BaseController {
  protected logger: pino.Logger;
  constructor(logger: pino.Logger) {
    this.logger = logger;
  }
}
