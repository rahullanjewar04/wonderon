import { BookRepository } from 'repositories/book';
import { BaseService } from './base';
import pino from 'pino';
import { BookCreateServer, BookList, BookUpdateServer } from '@schema/book';
import { PaginatedResult } from './types';
import { Prisma } from '@utils/prisma/generated/client';
import { Logger } from '@utils/logger';

export class BookService extends BaseService {
  private bookRepository: BookRepository;

  constructor(bookRepository: BookRepository) {
    super();
    this.bookRepository = bookRepository;
  }

  async create(payload: BookCreateServer) {
    Logger.getInstance().debug({
      message: '[BookService] Creating book',
      payload,
    });

    return await this.bookRepository.create(payload);
  }

  async update(id: string, payload: BookUpdateServer) {
    Logger.getInstance().debug({
      message: '[BookService] Updating book',
      id,
      payload,
    });

    return await this.bookRepository.update(id, payload);
  }

  async softDelete(id: string) {
    Logger.getInstance().debug({
      message: '[BookService] Soft deleting book',
      id,
    });

    return await this.bookRepository.softDelete(id);
  }

  async hardDelete(id: string) {
    Logger.getInstance().debug({
      message: '[BookService] Hard deleting book',
      id,
    });

    return await this.bookRepository.hardDelete(id);
  }

  async getById(id: string) {
    Logger.getInstance().debug({
      message: '[BookService] Getting book',
      id,
    });

    return await this.bookRepository.getById(id);
  }

  async list(payload: BookList): Promise<PaginatedResult<Prisma.BookModel>> {
    Logger.getInstance().debug({
      message: '[BookService] Listing books',
      payload,
    });

    const items = await this.bookRepository.list(payload);

    Logger.getInstance().debug({
      message: '[BookService] Listed books',
      items,
    });

    return {
      items: items.slice(0, payload.take),
      nextCursor: items.length > payload.take ? items[items.length - 1].id : undefined,
    };
  }
}
