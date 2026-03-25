'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('shifts');
    if (table.start_at) await queryInterface.removeColumn('shifts', 'start_at');
    if (table.end_at) await queryInterface.removeColumn('shifts', 'end_at');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('shifts', 'start_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('shifts', 'end_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};

