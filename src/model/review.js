import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Review = sequelize.define(
  'Review',
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_reviews_student_id',
        fields: ['student_id'],
      },
      {
        name: 'idx_reviews_university_id',
        fields: ['university_id'],
      },
      {
        name: 'idx_reviews_status',
        fields: ['status'],
      },
    ],
  }
);

Review.associate = (models) => {
  Review.belongsTo(models.StudentProfile, {
    foreignKey: 'student_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Review.belongsTo(models.University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

export default Review;
