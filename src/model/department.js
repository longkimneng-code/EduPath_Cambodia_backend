import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Department = sequelize.define(
  'Department',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_departments_university_id',
        fields: ['university_id'],
      },
    ],
  }
);

Department.associate = (models) => {
  Department.belongsTo(models.University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  if (models.Major) {
    Department.hasMany(models.Major, {
      foreignKey: 'department_id',
      as: 'majors',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};

export default Department;
