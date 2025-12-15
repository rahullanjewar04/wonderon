import { BookRepository } from 'repositories/book';
import { BaseService } from './base';
import pino from 'pino';
import { BookCreateServer, BookList } from '@schema/book';
import { PaginatedResult } from './types';
import { Prisma } from '@utils/prisma/generated/client';

export class BookService extends BaseService {
  private bookRepository: BookRepository;

  constructor(bookRepository: BookRepository, logger: pino.Logger) {
    super(logger);
    this.bookRepository = bookRepository;
  }

  async create(payload: BookCreateServer) {
    this.logger.debug(`[BookService] Creating book, ${payload}`);

    return await this.bookRepository.create(payload);
  }

  async update(id: string, payload: BookCreateServer) {
    this.logger.debug(`[BookService] Updating book, ${id}`);

    return await this.bookRepository.update(id, payload);
  }

  async softDelete(id: string) {
    this.logger.debug(`[BookService] Soft deleting book, ${id}`);

    return await this.bookRepository.softDelete(id);
  }

  async hardDelete(id: string) {
    this.logger.debug(`[BookService] Hard deleting book, ${id}`);

    return await this.bookRepository.hardDelete(id);
  }

  async getById(id: string) {
    this.logger.debug(`[BookService] Getting book, ${id}`);

    return await this.bookRepository.getById(id);
  }

  async list(payload: BookList): Promise<PaginatedResult<Prisma.BookModel>> {
    this.logger.debug(`[BookService] Listing books, ${payload}`);

    const items = await this.bookRepository.list(payload);

    return {
      items,
      cursor: items.length > payload.take ? items[payload.take - 1].id : undefined,
    };
  }
}
