import { BookService } from '@services/book';
import { BaseController } from './base';
import { Request, Response } from 'express';
import { bookCreateServer, BookList, bookUpdateServer, listBooksSchema, BookListSortKeys } from '@schema/book';
import { AppError } from '@utils/error';
import { DEFAULT_TAKE } from '@schema/common';
import { Logger } from '@utils/logger';

export class BookController extends BaseController {
  private bookService: BookService;

  /**
   * Constructs a new instance of the BookController.
   * @param {BookService} bookService - The book service instance.
   */
  constructor(bookService: BookService) {
    super();

    /**
     * The book service instance.
     * @private
     */
    this.bookService = bookService;
  }

  /**
   * Gets a book by ID.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async getById(req: Request, res: Response) {
    const id = req.params.id;

    Logger.getInstance().info({
      message: '[BookController] Get book',
      id,
    });

    const result = await this.bookService.getById(id);

    if (!result) {
      // If the book is not found, throw an error
      throw new AppError(AppError.NOT_FOUND, 'Book not found');
    }

    // TODO: Assuming books can be read by any user, if its private to user need to add checks
    // Check if the book is private to the user and if the user is not the owner, throw an error
    // if (!result.isPublic && result.createdBy !== req.user.id) {
    //   throw new AppError(AppError.FORBIDDEN, 'Book is private to the user');
    // }

    res.status(200).send(result);
  }

  /**
   * Creates a new book.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async create(req: Request, res: Response) {
    const payload = req.body;

    // Log the creation of a new book
    Logger.getInstance().info({
      message: '[BookController] Create book',
      payload,
    });

    // Set the created by and published by fields
    payload.createdBy = req.user.id;
    payload.publishedBy = req.user.name;

    // Parse the payload using the bookCreateServer schema
    const data = bookCreateServer.parse(payload);

    // Create the book
    const result = await this.bookService.create(data);

    // Send the response
    res.status(201).send(result);
  }

  /**
   * Updates a book.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async update(req: Request, res: Response) {
    const id = req.params.id;
    const payload = req.body;

    // Log the update of a book
    Logger.getInstance().info({
      message: '[BookController] Update book',
      id,
      payload,
    });

    // Set the updated by field
    payload.updatedBy = req.user.id;

    // Parse the payload using the bookUpdateServer schema
    const data = bookUpdateServer.parse(payload);

    // Update the book
    const result = await this.bookService.update(id, data);

    // Send the response
    res.status(200).send(result);
  }

  /**
   * Soft deletes a book.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async delete(req: Request, res: Response) {
    const id = req.params.id;

    // Log the deletion of a book
    Logger.getInstance().info({
      message: '[BookController] Delete book',
      id,
    });

    // Soft delete the book
    await this.bookService.softDelete(id);

    // Send the response
    res.status(200).send({});
  }

  /**
   * Lists books.
   * @param {Request} req - The HTTP request.
   * @param {Response} res - The HTTP response.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   * @description
   *   This method lists books based on the provided parameters.
   *   The parameters include the number of books to take, the cursor to start from, and the sort order.
   */
  async list(req: Request, res: Response) {
    // Parse the query parameters
    const payload = this.parseQueryParams(req.query);

    // Create the client payload
    const clientPayload: BookList = {
      // The number of books to take
      take: payload.limit,
      // The sort order
      sort: payload.sort as { field: BookListSortKeys; order: 'asc' | 'desc' },
    };

    // If a cursor is provided, add it to the client payload
    if (payload.cursor) {
      clientPayload.cursor = payload.cursor;
    }

    // Log the request
    Logger.getInstance().info({
      message: '[BookController] List books',
      clientPayload,
    });

    // Parse the client payload using the listBooksSchema
    const data = listBooksSchema.parse(clientPayload);

    // List the books
    const result = await this.bookService.list(data);

    // Send the response
    res.status(200).send(result);
  }
}
