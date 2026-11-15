import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Facility = sequelize.define(
  'Facility',
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
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: 'facilities',
    timestamps: false,
    indexes: [
      {
        name: 'idx_facilities_university_id',
        fields: ['university_id'],
      },
    ],
  }
);

Facility.associate = (models) => {
  Facility.belongsTo(models.University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

export default Facility;
