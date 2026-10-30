import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StudentProfile = sequelize.define(
  'StudentProfile',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    interests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    strengths: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    career_goal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'student_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default StudentProfile;

