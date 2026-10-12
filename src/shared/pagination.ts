export const paginationHelper = (query: {
  page: number;
  limit: number;
  status?: string;
}) => {
  let { page = 1, limit = 30, status = "" } = query;
  page = Number(page);
  limit = Number(limit);

  const skip = (page - 1) * limit;

  return { skip, limit, page, status };
};
