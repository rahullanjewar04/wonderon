import { BookService } from '@services/book';
import { Logger } from '@utils/logger';
import { PrismaWrapper } from '@utils/prisma';
import { Router } from 'express';
import { BookRepository } from 'repositories/book';
import { BookController } from '../controllers/book';

export function getBookRouter() {
  const bookRouter = Router();

  const prismaClient = PrismaWrapper.getInstance();

  const bookRepository = new BookRepository(prismaClient);
  const bookService = new BookService(bookRepository);
  const bookController = new BookController(bookService);

  bookRouter.get('/', bookController.list.bind(bookController));
  bookRouter.post('/', bookController.create.bind(bookController));
  bookRouter.get('/:id', bookController.getById.bind(bookController));
  bookRouter.patch('/:id', bookController.update.bind(bookController));
  bookRouter.delete('/:id', bookController.delete.bind(bookController));

  return bookRouter;
}
