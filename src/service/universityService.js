import { universityRepository } from '../repository/universityRepository.js';
import { parseUniversityQuery, positiveInteger, RequestError } from './discoveryQuery.js';

export function createUniversityService(repository = universityRepository) {
  return {
    async list(query) {
      const parsed = parseUniversityQuery(query);
      const { count, rows } = await repository.list(parsed);
      return { data: rows, pagination: {
        page: parsed.page, limit: parsed.limit, total: count,
        totalPages: Math.ceil(count / parsed.limit),
      } };
    },
    async detail(value) {
      const id = positiveInteger(value, 'id');
      const university = await repository.findById(id);
      if (!university) throw new RequestError('University not found', 404);
      return { data: university };
    },
    async filters() { return { data: await repository.filters() }; },
    async homepage(query) {
      const limit = positiveInteger(query.limit, 'limit', 4, 12);
      return { data: await repository.homepage(limit) };
    },
  };
}
