'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('student_profiles', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    province: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    date_of_birth: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    interests: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    strengths: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    career_goal: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('student_profiles');
}

