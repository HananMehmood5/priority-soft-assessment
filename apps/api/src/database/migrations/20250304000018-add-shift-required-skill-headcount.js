'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('shifts');
    if (!table.required_skill_id) {
      await queryInterface.addColumn('shifts', 'required_skill_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'skills', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!table.headcount_needed) {
      await queryInterface.addColumn('shifts', 'headcount_needed', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
    }

    // Backfill any existing shifts created before this migration existed.
    await queryInterface.sequelize.query(
      `
        UPDATE shifts
        SET required_skill_id = COALESCE(
          required_skill_id,
          (SELECT id FROM skills ORDER BY created_at ASC LIMIT 1)
        )
        WHERE required_skill_id IS NULL
      `,
      { type: Sequelize.QueryTypes.UPDATE },
    );

    // Make required_skill_id non-null after backfill.
    await queryInterface.changeColumn('shifts', 'required_skill_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'skills', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('shifts');
    if (table.required_skill_id) {
      await queryInterface.removeColumn('shifts', 'required_skill_id');
    }
    if (table.headcount_needed) {
      await queryInterface.removeColumn('shifts', 'headcount_needed');
    }
  },
};

