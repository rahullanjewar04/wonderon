import { BookCreateServer, BookList } from '@schema/book';
import { BaseRepository } from './base';
import { BookFindManyArgs } from '@utils/prisma/generated/models';
import { Prisma } from '@utils/prisma/generated/client';

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

  async softDelete(id: string) {
    this.logger.debug(`[BookRepository] Soft deleting book, ${id}`);

    return await this.prismaClient.book.update({
      where: {
        id,
      },
      data: {
        deleted: true,
      },
    });
  }

  async hardDelete(id: string) {
    this.logger.debug(`[BookRepository] Deleting book, ${id}`);

    return await this.prismaClient.book.delete({
      where: {
        id,
      },
    });
  }

  async list(payload: BookList): Promise<Prisma.BookModel[]> {
    this.logger.debug(`[BookRepository] Listing books`);

    const args: BookFindManyArgs = {
      where: {},
    };

    if (payload.filters) {
      if (payload.filters.title) args.where!['title'] = payload.filters.title;
      if (payload.filters.authors) args.where!['authors'] = payload.filters.authors;
      if (payload.filters.createdBy) args.where!['createdBy'] = payload.filters.createdBy;
      if (payload.filters.publishedBy) args.where!['publishedBy'] = payload.filters.publishedBy;

      // If deleted is not set, default to false
      if (payload.filters.deleted !== undefined) {
        args.where!['deleted'] = payload.filters.deleted;
      } else {
        args.where!['deleted'] = false;
      }
    }

    return await this.prismaClient.book.findMany({
      take: payload.take + 1,
      cursor: { id: payload.cursor },
      where: args.where,
    });
  }
}
