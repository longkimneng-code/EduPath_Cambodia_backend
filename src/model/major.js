import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export default sequelize.define('Major', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  degreeLevel: { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: 'majors', timestamps: true });
