export type PaginatedResult<T> = {
  items: T[];
  nextCursor?: string;
};
