import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define(
  'Notification',
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('info', 'alert', 'reminder', 'event', 'scholarship', 'system'),
      allowNull: false,
      defaultValue: 'info',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_notifications_student_id',
        fields: ['student_id'],
      },
      {
        name: 'idx_notifications_is_read',
        fields: ['is_read'],
      },
    ],
  }
);

Notification.associate = (models) => {
  Notification.belongsTo(models.StudentProfile, {
    foreignKey: 'student_id',
    as: 'student',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
};

export default Notification;
