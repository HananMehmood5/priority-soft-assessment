'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('shifts');
    if (table.days_of_week) return;

    const allDays = [0, 1, 2, 3, 4, 5, 6];

    await queryInterface.addColumn('shifts', 'days_of_week', {
      type: Sequelize.JSONB,
      allowNull: true,
      // Ensures future inserts (e.g., seeders) don't fail after we set allowNull=false.
      defaultValue: JSON.stringify(allDays),
    });

    await queryInterface.sequelize.query(
      `
        UPDATE shifts
        SET days_of_week = CAST(:days AS jsonb)
        WHERE days_of_week IS NULL
      `,
      {
        type: Sequelize.QueryTypes.UPDATE,
        replacements: { days: JSON.stringify(allDays) },
      },
    );

    await queryInterface.changeColumn('shifts', 'days_of_week', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: JSON.stringify(allDays),
    });
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('shifts');
    if (!table.days_of_week) return;
    await queryInterface.removeColumn('shifts', 'days_of_week');
  },
};

