import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Scholarship = sequelize.define(
  'Scholarship',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    university_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'universities',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    provider: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eligibility: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    funding_type: {
      type: DataTypes.ENUM('full', 'partial', 'tuition_only', 'stipend'),
      allowNull: false,
      defaultValue: 'full',
    },
    degree_level: {
      type: DataTypes.ENUM('associate', 'bachelor', 'master', 'phd'),
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    application_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'expired'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'scholarships',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_scholarships_university_id',
        fields: ['university_id'],
      },
      {
        name: 'idx_scholarships_status',
        fields: ['status'],
      },
    ],
  }
);

Scholarship.associate = (models) => {
  Scholarship.belongsTo(models.University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
};

export default Scholarship;
