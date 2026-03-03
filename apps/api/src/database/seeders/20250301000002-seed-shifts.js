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
    const mon9 = new Date(nextWeek);
    mon9.setHours(9, 0, 0, 0);
    const mon17 = new Date(nextWeek);
    mon17.setHours(17, 0, 0, 0);
    const tue9 = new Date(mon9);
    tue9.setDate(tue9.getDate() + 1);
    const tue17 = new Date(mon17);
    tue17.setDate(tue17.getDate() + 1);

    await queryInterface.bulkInsert('shifts', [
      { id: crypto.randomUUID(), location_id: downtown, start_at: mon9, end_at: mon17, published: true, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), location_id: downtown, start_at: tue9, end_at: tue17, published: false, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), location_id: downtown, start_at: new Date(tue9.getTime() + 24 * 3600000), end_at: new Date(tue17.getTime() + 24 * 3600000), published: false, created_at: now, updated_at: now },
    ]);

    const allShifts = await queryInterface.sequelize.query('SELECT id FROM shifts ORDER BY start_at', { type: Sequelize.QueryTypes.SELECT });
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
