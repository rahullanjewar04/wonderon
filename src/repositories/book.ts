import { BookCreateServer, BookList, BookUpdateServer } from '@schema/book';
import { BaseRepository } from './base';
import { BookFindManyArgs } from '@utils/prisma/generated/models';
import { Prisma } from '@utils/prisma/generated/client';
import { Logger } from '@utils/logger';
import { als } from '@utils/async-local-storage';

export class BookRepository extends BaseRepository {
  async create(payload: BookCreateServer) {
    Logger.getInstance().debug({
      message: '[BookRepository] Creating book',
      payload,
    });

    return await this.prismaClient.book.create({
      data: payload,
    });
  }

  async update(id: string, payload: BookUpdateServer) {
    Logger.getInstance().debug({
      message: '[BookRepository] Updating book',
      id,
      payload,
    });

    const context = als.getStore();

    if (context) {
      context.oldData = await this.getById(id);
    }

    return await this.prismaClient.book.update({
      where: {
        id,
      },
      data: payload,
    });
  }

  async getById(id: string) {
    Logger.getInstance().debug({
      message: '[BookRepository] Getting book',
      id,
    });

    return await this.prismaClient.book.findUnique({
      where: {
        id,
      },
    });
  }

  async softDelete(id: string) {
    Logger.getInstance().debug({
      message: '[BookRepository] Soft deleting book',
      id,
    });

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
    Logger.getInstance().debug({
      message: '[BookRepository] Hard deleting book',
      id,
    });

    return await this.prismaClient.book.delete({
      where: {
        id,
      },
    });
  }

  async list(payload: BookList): Promise<Prisma.BookModel[]> {
    Logger.getInstance().debug({
      message: '[BookRepository] Listing books',
      payload,
    });

    const args: BookFindManyArgs = {
      where: {},
      take: payload.take + 1,
      cursor: payload.cursor ? { id: payload.cursor } : undefined,
      orderBy: payload.sort
        ? {
            [payload.sort.field]: payload.sort.order,
          }
        : {},
    };

    if (payload.filters) {
      if (payload.filters.title) args.where!['title'] = payload.filters.title;
      if (payload.filters.authors) args.where!['authors'] = payload.filters.authors;
      if (payload.filters.createdBy) args.where!['createdBy'] = payload.filters.createdBy;
      if (payload.filters.publishedBy) args.where!['publishedBy'] = payload.filters.publishedBy;
    }

    // Always list only the books that are not deleted
    args.where!['deleted'] = false;

    return await this.prismaClient.book.findMany(args);
  }
}
