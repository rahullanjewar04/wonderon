import { BookCreateServer } from '@schema/book';
import { BaseRepository } from './base';

export class BookRepository extends BaseRepository {
  async create(payload: BookCreateServer) {
    this.logger.debug(`[BookRepository] Creating book, ${payload}`);

    return await this.prismaClient.book.create({
      data: payload,
    });
  }

  async update(id: string, payload: BookCreateServer) {
    this.logger.debug(`[BookRepository] Updating book, ${id}`);

    return await this.prismaClient.book.update({
      where: {
        id,
      },
      data: payload,
    });
  }

  async getById(id: string) {
    this.logger.debug(`[BookRepository] Getting book, ${id}`);

    return await this.prismaClient.book.findUnique({
      where: {
        id,
      },
    });
  }

  async delete(id: string) {
    this.logger.debug(`[BookRepository] Deleting book, ${id}`);

    return await this.prismaClient.book.delete({
      where: {
        id,
      },
    });
  }
}
