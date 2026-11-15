'use strict';

export async function up(queryInterface, Sequelize) {
  const tables = await queryInterface.showAllTables();
  const exists = tables.some((t) => (typeof t === 'string' ? t : t.tableName) === 'events');

  if (!exists) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      university_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'universities',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      event_type: {
        type: Sequelize.ENUM('workshop', 'seminar', 'open_house', 'webinar', 'fair', 'other'),
        allowNull: false,
        defaultValue: 'workshop',
      },
      start_datetime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_datetime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      registration_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'pending', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('events', ['university_id'], {
      name: 'idx_events_university_id',
    });

    await queryInterface.addIndex('events', ['status'], {
      name: 'idx_events_status',
    });

    await queryInterface.addIndex('events', ['start_datetime'], {
      name: 'idx_events_start_datetime',
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.dropTable('events');
}
