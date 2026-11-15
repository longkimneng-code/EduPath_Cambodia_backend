import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EventRegistration = sequelize.define(
  'EventRegistration',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
    status: {
      type: DataTypes.ENUM('registered', 'attended', 'cancelled', 'pending'),
      allowNull: false,
      defaultValue: 'registered',
    },
    registered_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'event_registrations',
    timestamps: false,
    indexes: [
      {
        name: 'idx_event_registrations_event_id',
        fields: ['event_id'],
      },
      {
        name: 'idx_event_registrations_student_id',
        fields: ['student_id'],
      },
      {
        name: 'uniq_event_registrations_event_student',
        unique: true,
        fields: ['event_id', 'student_id'],
      },
    ],
  }
);

EventRegistration.associate = (models) => {
  EventRegistration.belongsTo(models.Event, {
    foreignKey: 'event_id',
    as: 'event',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  EventRegistration.belongsTo(models.StudentProfile, {
    foreignKey: 'student_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

export default EventRegistration;
