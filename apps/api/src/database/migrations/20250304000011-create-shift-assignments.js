'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shift_assignments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      shift_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'shifts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      skill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'skills', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      version: { type: Sequelize.INTEGER, defaultValue: 1 },
      overtime_override_reason: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shift_assignments');
  },
};

