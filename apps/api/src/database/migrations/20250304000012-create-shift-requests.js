'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'CREATE TYPE "enum_shift_requests_type" AS ENUM (\'swap\', \'drop\');'
    );
    await queryInterface.sequelize.query(
      'CREATE TYPE "enum_shift_requests_status" AS ENUM (\'pending\', \'accepted\', \'approved\', \'rejected\', \'cancelled\');'
    );

    await queryInterface.createTable('shift_requests', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      type: { type: Sequelize.ENUM('swap', 'drop'), allowNull: false },
      assignment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'shift_assignments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      counterpart_assignment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'shift_assignments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      claimer_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shift_requests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_shift_requests_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_shift_requests_type";');
  },
};

