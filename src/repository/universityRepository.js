import { Op } from 'sequelize';
import { University, Major, UniversityMajor } from '../model/index.js';

const cardAttributes = [
  'id', 'slug', 'name', 'shortName', 'description', 'type', 'province',
  'imageUrl', 'logoUrl', 'tuitionMin', 'tuitionMax', 'currency', 'tuitionPeriod',
  'isFeatured', 'sourceUrl', 'informationVerifiedAt',
];
const majorInclude = { model: Major, as: 'majors', through: { attributes: [] } };
const literalSearch = value => value.replace(/[\\%_]/g, '\\$&');

export function buildUniversityWhere(query, matchingIds) {
  const where = {};
  if (query.search) {
    const pattern = `%${literalSearch(query.search)}%`;
    where[Op.or] = ['name', 'shortName'].map(field => ({ [field]: { [Op.like]: pattern } }));
  }
  if (query.location) where.province = query.location;
  if (query.type) where.type = query.type;
  if (query.featured !== undefined) where.isFeatured = query.featured;
  if (matchingIds !== undefined) where.id = { [Op.in]: matchingIds };
  return where;
}

export function universityOrder(sort) {
  return {
    name: [['name', 'ASC'], ['id', 'ASC']],
    name_desc: [['name', 'DESC'], ['id', 'ASC']],
    newest: [['createdAt', 'DESC'], ['id', 'DESC']],
    tuition_asc: [['tuitionMin', 'ASC'], ['id', 'ASC']],
  }[sort];
}

export const universityRepository = {
  async list(query) {
    // Filter on the join table first so pagination counts universities, not joined majors.
    const matchingIds = query.majorId === undefined ? undefined :
      (await UniversityMajor.findAll({ where: { majorId: query.majorId }, attributes: ['universityId'], raw: true }))
        .map(row => row.universityId);
    return University.findAndCountAll({
      attributes: cardAttributes, where: buildUniversityWhere(query, matchingIds),
      include: [majorInclude], distinct: true,
      order: universityOrder(query.sort), limit: query.limit, offset: query.offset,
    });
  },
  findById(id) {
    return University.findByPk(id, { include: [majorInclude] });
  },
  async filters() {
    const [rows, majors] = await Promise.all([
      University.findAll({ attributes: ['province'], group: ['province'], order: [['province', 'ASC']], raw: true }),
      Major.findAll({ attributes: ['id', 'name', 'degreeLevel'], order: [['name', 'ASC']] }),
    ]);
    return { locations: rows.map(row => row.province), majors, types: ['public', 'private'] };
  },
  async homepage(limit) {
    const [featuredUniversities, universities, majors, locations] = await Promise.all([
      University.findAll({ attributes: cardAttributes, where: { isFeatured: true }, include: [majorInclude], order: [['name', 'ASC'], ['id', 'ASC']], limit }),
      University.count(), Major.count(), University.count({ distinct: true, col: 'province' }),
    ]);
    return { featuredUniversities, stats: { universities, majors, locations } };
  },
};
