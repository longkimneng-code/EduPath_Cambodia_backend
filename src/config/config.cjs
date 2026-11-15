
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(
    __dirname,
    process.env.ENV_FILE || '../../.env'
  ),
});

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true'
      ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
      : {},
  },
};
