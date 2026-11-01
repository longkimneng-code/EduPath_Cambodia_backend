import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const University = sequelize.define('University', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
  shortName: { type: DataTypes.STRING(30), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  type: { type: DataTypes.ENUM('public', 'private'), allowNull: false },
  province: { type: DataTypes.STRING(100), allowNull: false },
  address: { type: DataTypes.STRING(500), allowNull: true },
  website: { type: DataTypes.STRING(500), allowNull: true },
  email: { type: DataTypes.STRING(150), allowNull: true },
  phone: { type: DataTypes.STRING(50), allowNull: true },
  imageUrl: { type: DataTypes.STRING(500), allowNull: true },
  logoUrl: { type: DataTypes.STRING(500), allowNull: true },
  latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  tuitionMin: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  tuitionMax: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
  tuitionPeriod: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'year' },
  departments: { type: DataTypes.JSON, allowNull: true },
  facilities: { type: DataTypes.JSON, allowNull: true },
  admissionRequirements: { type: DataTypes.JSON, allowNull: true },
  isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sourceUrl: { type: DataTypes.STRING(500), allowNull: true },
  informationVerifiedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'universities', timestamps: true,
  indexes: [{ fields: ['province'] }, { fields: ['isFeatured'] }],
});

export default University;
