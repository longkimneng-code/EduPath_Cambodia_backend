import 'dotenv/config';
import sequelize from '../config/database.js';
import { University, Major, UniversityMajor } from '../model/index.js';

try {
  await sequelize.authenticate();
  // Only create missing discovery tables. Never alter/drop existing tables or touch auth tables.
  await University.sync();
  await Major.sync();
  await UniversityMajor.sync();
  console.log('Discovery tables are ready. Existing table definitions and records were preserved.');
} catch (error) {
  console.error('Discovery table setup failed:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
