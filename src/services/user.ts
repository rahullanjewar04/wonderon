import { UserCreate } from '../schema/user';
import { Logger } from '../utils/logger';

export function createUser(payload: UserCreate) {
  Logger.getInstance().info(`Creating user: ${JSON.stringify(payload)}`);

  return payload;
}
