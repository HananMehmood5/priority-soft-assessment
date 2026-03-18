/* Drop legacy start_at/end_at columns now that shifts use date range + daily times. */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('shifts', 'start_at');
    await queryInterface.removeColumn('shifts', 'end_at');
  },

  down: async (queryInterface, Sequelize) => {
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

