'use strict';

const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const locs = await queryInterface.sequelize.query('SELECT id, name FROM locations', { type: Sequelize.QueryTypes.SELECT });
    const locByName = {};
    locs.forEach((l) => { locByName[l.name] = l.id; });
    const skills = await queryInterface.sequelize.query('SELECT id, name FROM skills', { type: Sequelize.QueryTypes.SELECT });
    const skillByName = {};
    skills.forEach((s) => { skillByName[s.name] = s.id; });
    const users = await queryInterface.sequelize.query('SELECT id, email FROM users WHERE role = ?', { replacements: ['Staff'], type: Sequelize.QueryTypes.SELECT });
    const staffIds = users.map((u) => u.id);

    const downtown = locByName['Coastal Eats Downtown'];
    const serverSkill = skillByName['server'];
    const bartenderSkill = skillByName['bartender'];

    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const mon = new Date(nextWeek);
    // Normalize to Monday of next week (JS: 0=Sun)
    const day = mon.getDay();
    const deltaToMon = ((1 - day) + 7) % 7;
    mon.setDate(mon.getDate() + deltaToMon);
    mon.setHours(0, 0, 0, 0);
    const tue = new Date(mon);
    tue.setDate(tue.getDate() + 1);
    const wed = new Date(mon);
    wed.setDate(wed.getDate() + 2);

    const toISODateOnly = (d) => d.toISOString().slice(0, 10);

    await queryInterface.bulkInsert('shifts', [
      {
        id: crypto.randomUUID(),
        location_id: downtown,
        start_date: toISODateOnly(mon),
        end_date: toISODateOnly(mon),
        daily_start_time: '09:00',
        daily_end_time: '17:00',
        published: true,
        required_skill_id: serverSkill,
        headcount_needed: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        location_id: downtown,
        start_date: toISODateOnly(tue),
        end_date: toISODateOnly(tue),
        daily_start_time: '09:00',
        daily_end_time: '17:00',
        published: false,
        required_skill_id: serverSkill,
        headcount_needed: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        location_id: downtown,
        start_date: toISODateOnly(wed),
        end_date: toISODateOnly(wed),
        daily_start_time: '09:00',
        daily_end_time: '17:00',
        published: false,
        required_skill_id: serverSkill,
        headcount_needed: 1,
        created_at: now,
        updated_at: now,
      },
    ]);

    const allShifts = await queryInterface.sequelize.query('SELECT id FROM shifts ORDER BY start_date', { type: Sequelize.QueryTypes.SELECT });
    if (allShifts.length >= 1 && staffIds.length >= 1) {
      await queryInterface.bulkInsert('shift_assignments', [{
        id: crypto.randomUUID(),
        shift_id: allShifts[0].id,
        user_id: staffIds[0],
        skill_id: serverSkill,
        version: 1,
        created_at: now,
        updated_at: now,
      }]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('shift_assignments', {});
    await queryInterface.bulkDelete('shifts', {});
  },
};
