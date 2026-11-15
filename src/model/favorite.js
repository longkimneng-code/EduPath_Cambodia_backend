import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Favorite = sequelize.define(
  'Favorite',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'student_profiles',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    university_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'universities',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    tableName: 'favorites',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_favorites_student_id',
        fields: ['student_id'],
      },
      {
        name: 'idx_favorites_university_id',
        fields: ['university_id'],
      },
      {
        name: 'uniq_favorites_student_university',
        unique: true,
        fields: ['student_id', 'university_id'],
      },
    ],
  }
);

Favorite.associate = (models) => {
  Favorite.belongsTo(models.StudentProfile, {
    foreignKey: 'student_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Favorite.belongsTo(models.University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

export default Favorite;
