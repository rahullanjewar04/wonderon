import pino from 'pino';

export abstract class BaseService {
  protected logger: pino.Logger;

  constructor(logger: pino.Logger) {
    this.logger = logger;
  }
}
