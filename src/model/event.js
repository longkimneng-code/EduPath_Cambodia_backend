import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Event = sequelize.define(
  'Event',
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
    title: {
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
    event_type: {
      type: DataTypes.ENUM('workshop', 'seminar', 'open_house', 'webinar', 'fair', 'other'),
      allowNull: false,
      defaultValue: 'workshop',
    },
    start_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_datetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    registration_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_events_university_id',
        fields: ['university_id'],
      },
      {
        name: 'idx_events_status',
        fields: ['status'],
      },
      {
        name: 'idx_events_start_datetime',
        fields: ['start_datetime'],
      },
    ],
  }
);

Event.associate = (models) => {
  Event.belongsTo(models.University, {
    foreignKey: 'university_id',
    as: 'university',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Event.hasMany(models.EventRegistration, {
    foreignKey: 'event_id',
    as: 'registrations',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

export default Event;
