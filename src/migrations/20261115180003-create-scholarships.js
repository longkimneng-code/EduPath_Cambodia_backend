'use strict';

export async function up(queryInterface, Sequelize) {
  const tables = await queryInterface.showAllTables();
  const exists = tables.some((t) => (typeof t === 'string' ? t : t.tableName) === 'scholarships');

  if (!exists) {
    await queryInterface.createTable('scholarships', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      university_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'universities',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      eligibility: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      funding_type: {
        type: Sequelize.ENUM('full', 'partial', 'tuition_only', 'stipend'),
        allowNull: false,
        defaultValue: 'full',
      },
      degree_level: {
        type: Sequelize.ENUM('associate', 'bachelor', 'master', 'phd'),
        allowNull: true,
      },
      deadline: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      application_link: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'pending', 'expired'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('scholarships', ['university_id'], {
      name: 'idx_scholarships_university_id',
    });

    await queryInterface.addIndex('scholarships', ['status'], {
      name: 'idx_scholarships_status',
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.dropTable('scholarships');
}
