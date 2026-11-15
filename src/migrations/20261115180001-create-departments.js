'use strict';

export async function up(queryInterface, Sequelize) {
  const tables = await queryInterface.showAllTables();
  const exists = tables.some((t) => (typeof t === 'string' ? t : t.tableName) === 'departments');

  if (!exists) {
    await queryInterface.createTable('departments', {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('departments', ['university_id'], {
      name: 'idx_departments_university_id',
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.dropTable('departments');
}
