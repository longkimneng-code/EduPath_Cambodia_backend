'use strict';

export async function up(queryInterface, Sequelize) {
  const tables = await queryInterface.showAllTables();
  const exists = tables.some((t) => (typeof t === 'string' ? t : t.tableName) === 'favorites');

  if (!exists) {
    await queryInterface.createTable('favorites', {
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('favorites', ['student_id'], {
      name: 'idx_favorites_student_id',
    });

    await queryInterface.addIndex('favorites', ['university_id'], {
      name: 'idx_favorites_university_id',
    });

    await queryInterface.addIndex('favorites', ['student_id', 'university_id'], {
      name: 'uniq_favorites_student_university',
      unique: true,
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.dropTable('favorites');
}
