'use strict';

export async function up(queryInterface, Sequelize) {
  const tableInfo = await queryInterface.describeTable('users');

  // Add name column if it does not exist
  if (!tableInfo.name) {
    await queryInterface.addColumn('users', 'name', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    });
  }

  // Add password_hash column if it does not exist
  if (!tableInfo.password_hash) {
    await queryInterface.addColumn('users', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: '',
    });
  }

  // Add profile_image column if it does not exist
  if (!tableInfo.profile_image) {
    await queryInterface.addColumn('users', 'profile_image', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  }

  // Modify role ENUM to include 'student', 'admin', 'faculty'
  await queryInterface.changeColumn('users', 'role', {
    type: Sequelize.ENUM('student', 'admin', 'faculty'),
    allowNull: false,
    defaultValue: 'student',
  });

  // Adjust phone length to 50
  if (tableInfo.phone) {
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  }

  // Drop old columns if they still exist
  if (tableInfo.username) {
    await queryInterface.removeColumn('users', 'username');
  }
  if (tableInfo.firstName) {
    await queryInterface.removeColumn('users', 'firstName');
  }
  if (tableInfo.lastName) {
    await queryInterface.removeColumn('users', 'lastName');
  }
  if (tableInfo.country) {
    await queryInterface.removeColumn('users', 'country');
  }
  if (tableInfo.password) {
    await queryInterface.removeColumn('users', 'password');
  }

  // Map timestamp column names to snake_case if previously camelCase
  if (tableInfo.createdAt && !tableInfo.created_at) {
    await queryInterface.renameColumn('users', 'createdAt', 'created_at');
  }
  if (tableInfo.updatedAt && !tableInfo.updated_at) {
    await queryInterface.renameColumn('users', 'updatedAt', 'updated_at');
  }
}

export async function down(queryInterface, Sequelize) {
  const tableInfo = await queryInterface.describeTable('users');

  if (tableInfo.password_hash) {
    await queryInterface.removeColumn('users', 'password_hash');
  }
  if (tableInfo.profile_image) {
    await queryInterface.removeColumn('users', 'profile_image');
  }
}

