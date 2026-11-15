'use strict';

export async function up(queryInterface, Sequelize) {
  const tables = await queryInterface.showAllTables();
  const exists = tables.some((t) => (typeof t === 'string' ? t : t.tableName) === 'notifications');

  if (!exists) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'student_profiles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('info', 'alert', 'reminder', 'event', 'scholarship', 'system'),
        allowNull: false,
        defaultValue: 'info',
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('notifications', ['student_id'], {
      name: 'idx_notifications_student_id',
    });

    await queryInterface.addIndex('notifications', ['is_read'], {
      name: 'idx_notifications_is_read',
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.dropTable('notifications');
}
