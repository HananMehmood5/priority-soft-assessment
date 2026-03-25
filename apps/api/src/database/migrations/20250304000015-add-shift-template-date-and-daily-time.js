'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('shifts');

    const hasStartDate = !!table.start_date;
    const hasEndDate = !!table.end_date;
    const hasDailyStartTime = !!table.daily_start_time;
    const hasDailyEndTime = !!table.daily_end_time;

    const hasLegacyStartAt = !!table.start_at;
    const hasLegacyEndAt = !!table.end_at;

    // Add columns (idempotent).
    if (!hasStartDate) {
      await queryInterface.addColumn('shifts', 'start_date', { type: Sequelize.DATEONLY, allowNull: true });
    }
    if (!hasEndDate) {
      await queryInterface.addColumn('shifts', 'end_date', { type: Sequelize.DATEONLY, allowNull: true });
    }
    if (!hasDailyStartTime) {
      await queryInterface.addColumn('shifts', 'daily_start_time', { type: Sequelize.STRING, allowNull: true });
    }
    if (!hasDailyEndTime) {
      await queryInterface.addColumn('shifts', 'daily_end_time', { type: Sequelize.STRING, allowNull: true });
    }

    // Backfill from legacy columns if they exist.
    if (hasLegacyStartAt && hasLegacyEndAt) {
      const rows = await queryInterface.sequelize.query(
        `
          SELECT
            id,
            start_at,
            end_at,
            start_date,
            end_date,
            daily_start_time,
            daily_end_time
          FROM shifts
        `,
        { type: Sequelize.QueryTypes.SELECT },
      );

      for (const r of rows) {
        const startAt = r.start_at ? new Date(r.start_at) : null;
        const endAt = r.end_at ? new Date(r.end_at) : null;

        if (!startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) continue;

        const needsBackfill =
          !r.start_date || !r.end_date || !r.daily_start_time || !r.daily_end_time;

        if (!needsBackfill) continue;

        const startISO = startAt.toISOString();
        const endISO = endAt.toISOString();

        const next = {
          start_date: startISO.slice(0, 10),
          end_date: endISO.slice(0, 10),
          daily_start_time: startISO.slice(11, 16),
          daily_end_time: endISO.slice(11, 16),
        };

        await queryInterface.sequelize.query(
          `
            UPDATE shifts
            SET
              start_date = :start_date,
              end_date = :end_date,
              daily_start_time = :daily_start_time,
              daily_end_time = :daily_end_time
            WHERE id = :id
          `,
          {
            type: Sequelize.QueryTypes.UPDATE,
            replacements: { id: r.id, ...next },
          },
        );
      }
    }

    // Enforce NOT NULL to match Sequelize model expectations (only safe after backfill).
    await queryInterface.changeColumn('shifts', 'start_date', { type: Sequelize.DATEONLY, allowNull: false });
    await queryInterface.changeColumn('shifts', 'end_date', { type: Sequelize.DATEONLY, allowNull: false });
    await queryInterface.changeColumn('shifts', 'daily_start_time', { type: Sequelize.STRING, allowNull: false });
    await queryInterface.changeColumn('shifts', 'daily_end_time', { type: Sequelize.STRING, allowNull: false });
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('shifts');

    if (table.daily_end_time) await queryInterface.removeColumn('shifts', 'daily_end_time');
    if (table.daily_start_time) await queryInterface.removeColumn('shifts', 'daily_start_time');
    if (table.end_date) await queryInterface.removeColumn('shifts', 'end_date');
    if (table.start_date) await queryInterface.removeColumn('shifts', 'start_date');
  },
};

