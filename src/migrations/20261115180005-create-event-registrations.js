'use strict';

export async function up(queryInterface, Sequelize) {
  const tables = await queryInterface.showAllTables();
  const exists = tables.some((t) => (typeof t === 'string' ? t : t.tableName) === 'event_registrations');

  if (!exists) {
    await queryInterface.createTable('event_registrations', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
      status: {
        type: Sequelize.ENUM('registered', 'attended', 'cancelled', 'pending'),
        allowNull: false,
        defaultValue: 'registered',
      },
      registered_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('event_registrations', ['event_id'], {
      name: 'idx_event_registrations_event_id',
    });

    await queryInterface.addIndex('event_registrations', ['student_id'], {
      name: 'idx_event_registrations_student_id',
    });

    await queryInterface.addIndex('event_registrations', ['event_id', 'student_id'], {
      name: 'uniq_event_registrations_event_student',
      unique: true,
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.dropTable('event_registrations');
}
