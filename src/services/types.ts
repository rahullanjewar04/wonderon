export type PaginatedResult<T> = {
  items: T[];
  cursor?: string;
};
