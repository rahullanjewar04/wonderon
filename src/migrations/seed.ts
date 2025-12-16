import { bookCreateServer, BookCreateServer } from '@schema/book';
import { userCreateServer, UserCreateServer } from '@schema/user';
import { BookService } from '@services/book';
import { UserService } from '@services/user';
import { CryptoService } from '@utils/encryption';
import { Logger } from '@utils/logger';
import { PrismaWrapper } from '@utils/prisma';
import { Prisma } from '@utils/prisma/generated/client';
import { BookRepository } from 'repositories/book';
import { UserRepository } from 'repositories/user';

async function seedUsers(users: UserCreateServer[]): Promise<Prisma.UserModel[]> {
  const userRepository = new UserRepository(PrismaWrapper.getInstance());
  const userService = new UserService(userRepository);

  Logger.getInstance().info(`[UserService] Seeding ${users.length} users`);

  const promises: Promise<Prisma.UserModel>[] = [];

  for (const user of users) {
    const data = userCreateServer.parse(user);
    const exists = await userService.exists(user.email);

    if (exists) {
      continue;
    }

    const promise = userService.create(data);
    promises.push(promise);
  }

  const result = await Promise.all(promises);

  Logger.getInstance().info(`[UserService] Seeded ${result.length} users`);

  return result;
}

async function seedBooks(users: Prisma.UserModel[]) {
  const bookRepository = new BookRepository(PrismaWrapper.getInstance());
  const bookService = new BookService(bookRepository);

  Logger.getInstance().info(`[BookService] Seeding ${users.length} books`);

  if (users.length === 0) {
    return [];
  }

  const books: BookCreateServer[] = [
    {
      authors: 'John Doe',
      title: 'Book 1',
      createdBy: users[0].id,
      publishedBy: users[0].name,
    },
    {
      authors: 'Jane Doe',
      title: 'Book 2',
      createdBy: users[1].id,
      publishedBy: users[1].name,
    },
    {
      authors: 'William',
      title: 'Book 3',
      createdBy: users[3].id,
      publishedBy: users[3].name,
    },
    {
      authors: 'John Doe',
      title: 'Book 4',
      createdBy: users[4].id,
      publishedBy: users[4].name,
    },
  ];

  const promises: Promise<Prisma.BookModel>[] = [];

  for (const book of books) {
    const data = bookCreateServer.parse(book);
    const promise = bookService.create(data);
    promises.push(promise);
  }

  const result = await Promise.all(promises);

  Logger.getInstance().info(`[BookService] Seeded ${result.length} books`);

  return result;
}

export async function seed() {
  Logger.getInstance().info('Seeding database');

  const adminPassword = CryptoService.getInstance().encrypt('admin123');
  const reviewerPassword = CryptoService.getInstance().encrypt('reviewer123');

  const users: UserCreateServer[] = [
    {
      name: 'admin1',
      email: 'admin1@example.com',
      role: 'admin',
      credentials: adminPassword,
    },
    {
      name: 'admin2',
      email: 'admin2@example.com',
      role: 'admin',
      credentials: adminPassword,
    },
    {
      name: 'admin3',
      email: 'admin3@example.com',
      role: 'admin',
      credentials: adminPassword,
    },
    {
      name: 'reviewer1',
      email: 'reviewer1@example.com',
      role: 'reviewer',
      credentials: reviewerPassword,
    },
    {
      name: 'reviewer2',
      email: 'reviewer2@example.com',
      role: 'reviewer',
      credentials: reviewerPassword,
    },
    {
      name: 'reviewer3',
      email: 'reviewer3@example.com',
      role: 'reviewer',
      credentials: reviewerPassword,
    },
  ];

  const dbUsers = await seedUsers(users);
  await seedBooks(dbUsers);

  Logger.getInstance().info('Database seeded');
}
