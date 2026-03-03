'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'CREATE TYPE "enum_audit_logs_action" AS ENUM (\'create\', \'update\', \'delete\');'
    );
    await queryInterface.sequelize.query(
      'CREATE TYPE "enum_audit_logs_entity_type" AS ENUM (\'shift\', \'shift_assignment\');'
    );

    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      action: { type: Sequelize.ENUM('create', 'update', 'delete'), allowNull: false },
      entity_type: {
        type: Sequelize.ENUM('shift', 'shift_assignment'),
        allowNull: false,
      },
      entity_id: { type: Sequelize.UUID, allowNull: false },
      before: { type: Sequelize.JSONB, allowNull: true },
      after: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
    await queryInterface.addIndex('audit_logs', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_entity_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_action";');
  },
};

