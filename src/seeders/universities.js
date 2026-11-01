import 'dotenv/config';
import sequelize from '../config/database.js';
import { University, Major } from '../model/index.js';

// Demonstration records only. No fees, admissions claims, or live statistics are invented.
const universities = [
  { name: 'Royal University of Phnom Penh', slug: 'royal-university-of-phnom-penh', shortName: 'RUPP', type: 'public', province: 'Phnom Penh', website: 'https://www.rupp.edu.kh/', isFeatured: true },
  { name: 'Institute of Technology of Cambodia', slug: 'institute-of-technology-of-cambodia', shortName: 'ITC', type: 'public', province: 'Phnom Penh', website: 'https://itc.edu.kh/', isFeatured: true },
  { name: 'Pannasastra University of Cambodia', slug: 'pannasastra-university-of-cambodia', shortName: 'PUC', type: 'private', province: 'Phnom Penh', website: 'https://www.puc.edu.kh/', isFeatured: true },
  { name: 'American University of Phnom Penh', slug: 'american-university-of-phnom-penh', shortName: 'AUPP', type: 'private', province: 'Phnom Penh', website: 'https://www.aupp.edu.kh/', isFeatured: true },
];

try {
  await sequelize.authenticate();
  await sequelize.transaction(async transaction => {
    for (const data of universities) {
      await University.findOrCreate({ where: { slug: data.slug }, defaults: data, transaction });
    }
    // Catalog entries are intentionally not assigned to institutions without verification.
    for (const name of ['Computer Science', 'Business Administration', 'Civil Engineering']) {
      await Major.findOrCreate({ where: { name }, defaults: { name }, transaction });
    }
  });
  console.log('Demonstration university and major records seeded. Existing records were preserved.');
} catch (error) {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
