import 'dotenv/config';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Op } from 'sequelize';
import { createApp } from '../src/app.js';
import { createUniversityService } from '../src/service/universityService.js';
import { buildUniversityWhere, universityOrder, universityRepository } from '../src/repository/universityRepository.js';
import { University, UniversityMajor } from '../src/model/index.js';

let server, base, lastQuery;
const sample = { id: 1, name: 'Example University', majors: [{ id: 2, name: 'Computer Science' }] };
const repository = {
  async list(query) { lastQuery = query; return { count: 25, rows: [sample] }; },
  async findById(id) { return id === 1 ? sample : null; },
  async filters() { return { locations: ['Phnom Penh'], majors: sample.majors, types: ['public', 'private'] }; },
  async homepage(limit) { return { featuredUniversities: [sample].slice(0, limit), stats: { universities: 25, majors: 2, locations: 1 } }; },
};

before(async () => {
  server = createApp({ discoveryService: createUniversityService(repository) }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });

test('university list returns pagination and parses combined filters', async () => {
  const response = await fetch(`${base}/universities?search=Technology&location=Phnom%20Penh&majorId=2&type=public&featured=true&sort=newest&page=2&limit=10`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.pagination, { page: 2, limit: 10, total: 25, totalPages: 3 });
  assert.deepEqual(lastQuery, { page: 2, limit: 10, offset: 10, sort: 'newest', type: 'public', featured: true, search: 'Technology', location: 'Phnom Penh', majorId: 2 });
  assert.equal(body.data[0].majors[0].name, 'Computer Science');
});

test('university list has useful defaults', async () => {
  assert.equal((await fetch(`${base}/universities`)).status, 200);
  assert.equal(lastQuery.limit, 12);
  assert.equal(lastQuery.offset, 0);
  assert.equal(lastQuery.sort, 'name');
});

test('rejects malformed filters and pagination with 400 before repository access', async () => {
  for (const query of ['limit=101', 'page=0', 'page=1.5', 'page=-1', 'limit=NaN', 'featured=yes', 'majorId=abc', 'type=unknown', 'sort=name;DROP TABLE users', 'search=', 'location=', 'page=1&page=2', 'majorId=9007199254740992']) {
    lastQuery = null;
    const response = await fetch(`${base}/universities?${query}`);
    assert.equal(response.status, 400, query);
    assert.equal(lastQuery, null, query);
    assert.equal(typeof (await response.json()).message, 'string');
  }
});

test('filter metadata route precedes the dynamic university ID route', async () => {
  const response = await fetch(`${base}/universities/filters`);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data.locations, ['Phnom Penh']);
});

test('university details return majors, missing IDs return 404, malformed IDs return 400', async () => {
  const response = await fetch(`${base}/universities/1`);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, sample);
  assert.equal((await fetch(`${base}/universities/999`)).status, 404);
  assert.equal((await fetch(`${base}/universities/not-a-number`)).status, 400);
});

test('homepage returns stored statistics and featured universities, with bounded limit', async () => {
  const response = await fetch(`${base}/homepage`);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data.stats, { universities: 25, majors: 2, locations: 1 });
  assert.equal((await fetch(`${base}/homepage?limit=13`)).status, 400);
});

test('empty results have zero total pages', async () => {
  const service = createUniversityService({ async list() { return { count: 0, rows: [] }; } });
  const result = await service.list({});
  assert.deepEqual(result.data, []);
  assert.equal(result.pagination.totalPages, 0);
});

test('search escapes LIKE wildcards and uses structured predicates', () => {
  const where = buildUniversityWhere({ search: "100%_\\' OR 1=1", featured: false, location: 'Phnom Penh' }, [1, 2]);
  assert.equal(where[Op.or][0].name[Op.like], "%100\\%\\_\\\\' OR 1=1%");
  assert.deepEqual(where.id[Op.in], [1, 2]);
  assert.equal(where.isFeatured, false);
  assert.equal(where.province, 'Phnom Penh');
  assert.deepEqual(universityOrder('newest'), [['createdAt', 'DESC'], ['id', 'DESC']]);
});

test('major filtering preserves all major details and counts distinct universities', async () => {
  const originalJoins = UniversityMajor.findAll;
  const originalList = University.findAndCountAll;
  let options;
  try {
    UniversityMajor.findAll = async ({ where }) => {
      assert.deepEqual(where, { majorId: 2 });
      return [{ universityId: 1 }, { universityId: 3 }];
    };
    University.findAndCountAll = async value => { options = value; return { count: 2, rows: [] }; };
    await universityRepository.list({ majorId: 2, sort: 'name', limit: 12, offset: 0 });
    assert.deepEqual(options.where.id[Op.in], [1, 3]);
    assert.equal(options.distinct, true);
    assert.equal(options.include[0].as, 'majors');
    assert.equal(options.include[0].where, undefined);
    assert.equal(options.limit, 12);
  } finally {
    UniversityMajor.findAll = originalJoins;
    University.findAndCountAll = originalList;
  }
});

test('unexpected failures return generic JSON and are logged', async () => {
  const errors = [];
  const app = createApp({ discoveryService: { async homepage() { throw new Error('private database details'); } }, logger: { error(...args) { errors.push(args); } } });
  const temporary = app.listen(0, '127.0.0.1');
  await new Promise(resolve => temporary.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${temporary.address().port}/api/homepage`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { message: 'Internal server error' });
    assert.equal(errors.length, 1);
  } finally { await new Promise(resolve => temporary.close(resolve)); }
});

test('unknown routes return JSON 404', async () => {
  const response = await fetch(`${base}/unknown`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: 'Route not found' });
});

test('existing profile routes stay protected and Swagger stays available', async () => {
  for (const path of ['/users/profile', '/students/profile']) {
    assert.equal((await fetch(`${base}${path}`)).status, 401);
  }
  const docs = await fetch(`${base.replace('/api', '')}/api-docs/`);
  assert.equal(docs.status, 200);
  assert.match(await docs.text(), /Swagger UI/);
});
