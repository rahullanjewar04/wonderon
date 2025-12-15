import { BookService } from '@services/book';
import pino from 'pino';
import { BaseController } from './base';
import { Request, Response } from 'express';
import { bookCreateServer, listBooksSchema } from '@schema/book';
import { AppError } from '@utils/error';

export class BookController extends BaseController {
  private bookService: BookService;

  constructor(bookService: BookService, logger: pino.Logger) {
    super(logger);
    this.bookService = bookService;
  }

  async getById(req: Request, res: Response) {
    const id = req.params.id;

    this.logger.info({
      message: '[BookController] Get book',
      id,
    });

    const result = await this.bookService.getById(id);

    if (!result) {
      throw new AppError(AppError.NOT_FOUND, 'Book not found');
    }

    // TODO: Assuming books can be read by any user, if its private to user need to add checks

    res.status(200).send(result);
  }

  async create(req: Request, res: Response) {
    const payload = req.body;

    this.logger.info({
      message: '[BookController] Create book',
      payload,
    });

    payload.createdBy = req.user.id;
    payload.publishedBy = req.user.name;

    const data = bookCreateServer.parse(payload);

    const result = await this.bookService.create(data);

    res.status(201).send(result);
  }

  async update(req: Request, res: Response) {
    const id = req.params.id;
    const payload = req.body;

    this.logger.info({
      message: '[BookController] Update book',
      id,
      payload,
    });

    const result = await this.bookService.update(id, payload);

    res.status(200).send(result);
  }

  async delete(req: Request, res: Response) {
    const id = req.params.id;

    this.logger.info({
      message: '[BookController] Delete book',
      id,
    });

    const result = await this.bookService.softDelete(id);

    res.status(200).send(result);
  }

  async list(req: Request, res: Response) {
    const payload = req.query;

    this.logger.info({
      message: '[BookController] List books',
      payload,
    });

    const data = listBooksSchema.parse(payload);

    const result = await this.bookService.list(data);

    res.status(200).send({ items: result.items, cursor: result.cursor });
  }
}
