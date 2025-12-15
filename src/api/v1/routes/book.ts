import { BookService } from '@services/book';
import { Logger } from '@utils/logger';
import { PrismaWrapper } from '@utils/prisma';
import { Router } from 'express';
import { BookRepository } from 'repositories/book';
import { BookController } from '../controllers/book';

export function getBookRouter() {
  const bookRouter = Router();

  const prismaClient = PrismaWrapper.getInstance();
  const logger = Logger.getInstance();

  const bookRepository = new BookRepository(prismaClient, logger);
  const bookService = new BookService(bookRepository, logger);
  const bookController = new BookController(bookService, logger);

  bookRouter.get('/', bookController.list.bind(bookController));
  bookRouter.get('/:id', bookController.getById.bind(bookController));
  bookRouter.post('/', bookController.create.bind(bookController));
  bookRouter.put('/:id', bookController.update.bind(bookController));
  bookRouter.delete('/:id', bookController.delete.bind(bookController));

  return bookRouter;
}
