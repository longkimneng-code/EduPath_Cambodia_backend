export class RequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function positiveInteger(value, name, fallback, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new RequestError(`${name} must be a positive integer`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > max) {
    throw new RequestError(`${name} must be at most ${max}`);
  }
  return number;
}

function optionalText(value, name, max = 150) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new RequestError(`${name} must be text between 1 and ${max} characters`);
  }
  return value.trim();
}

export function parseUniversityQuery(query) {
  const page = positiveInteger(query.page, 'page', 1, 1000000);
  const limit = positiveInteger(query.limit, 'limit', 12, 100);
  const type = optionalText(query.type, 'type');
  if (type && !['public', 'private'].includes(type)) {
    throw new RequestError('type must be public or private');
  }
  const sort = query.sort ?? 'name';
  if (!['name', 'name_desc', 'newest', 'tuition_asc'].includes(sort)) {
    throw new RequestError('sort must be name, name_desc, newest, or tuition_asc');
  }
  let featured;
  if (query.featured !== undefined) {
    if (!['true', 'false'].includes(query.featured)) {
      throw new RequestError('featured must be true or false');
    }
    featured = query.featured === 'true';
  }
  return {
    page, limit, offset: (page - 1) * limit, sort, type, featured,
    search: optionalText(query.search, 'search'),
    location: optionalText(query.location, 'location', 100),
    majorId: positiveInteger(query.majorId, 'majorId', undefined),
  };
}
