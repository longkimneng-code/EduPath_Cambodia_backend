import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export default sequelize.define('UniversityMajor', {
  universityId: {
    type: DataTypes.INTEGER, primaryKey: true, allowNull: false,
    references: { model: 'universities', key: 'id' }, onDelete: 'CASCADE',
  },
  majorId: {
    type: DataTypes.INTEGER, primaryKey: true, allowNull: false,
    references: { model: 'majors', key: 'id' }, onDelete: 'CASCADE',
  },
}, { tableName: 'university_majors', timestamps: false });
