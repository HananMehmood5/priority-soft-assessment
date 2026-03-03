'use strict';

const bcrypt = require('bcrypt');
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();

    const userInserts = [
      { email: 'admin@coastaleats.com', role: 'Admin', name: 'Admin User' },
      { email: 'manager1@coastaleats.com', role: 'Manager', name: 'Manager One' },
      { email: 'manager2@coastaleats.com', role: 'Manager', name: 'Manager Two' },
      { email: 'staff1@coastaleats.com', role: 'Staff', name: 'Alice Server' },
      { email: 'staff2@coastaleats.com', role: 'Staff', name: 'Bob Bartender' },
      { email: 'staff3@coastaleats.com', role: 'Staff', name: 'Carol Cook' },
      { email: 'staff4@coastaleats.com', role: 'Staff', name: 'Dave Host' },
      { email: 'staff5@coastaleats.com', role: 'Staff', name: 'Eve Server' },
      { email: 'staff6@coastaleats.com', role: 'Staff', name: 'Frank Bartender' },
      { email: 'staff7@coastaleats.com', role: 'Staff', name: 'Grace Cook' },
      { email: 'staff8@coastaleats.com', role: 'Staff', name: 'Henry Host' },
      { email: 'staff9@coastaleats.com', role: 'Staff', name: 'Ivy Server' },
      { email: 'staff10@coastaleats.com', role: 'Staff', name: 'Jack Bartender' },
    ].map((u) => ({
      id: crypto.randomUUID(),
      email: u.email,
      password_hash: passwordHash,
      role: u.role,
      name: u.name,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('users', userInserts);

    const users = await queryInterface.sequelize.query('SELECT id, email FROM users', { type: Sequelize.QueryTypes.SELECT });
    const userById = {};
    users.forEach((r) => { userById[r.email] = r.id; });

    const locInserts = [
      { name: 'Coastal Eats Downtown', timezone: 'America/Los_Angeles' },
      { name: 'Coastal Eats Harbor', timezone: 'America/Los_Angeles' },
      { name: 'Coastal Eats East', timezone: 'America/New_York' },
      { name: 'Coastal Eats West', timezone: 'America/New_York' },
    ].map((l) => ({ id: crypto.randomUUID(), ...l, created_at: now, updated_at: now }));
    await queryInterface.bulkInsert('locations', locInserts);

    const locs = await queryInterface.sequelize.query('SELECT id, name FROM locations', { type: Sequelize.QueryTypes.SELECT });
    const locByName = {};
    locs.forEach((l) => { locByName[l.name] = l.id; });

    const skillInserts = ['bartender', 'line cook', 'server', 'host'].map((name) => ({
      id: crypto.randomUUID(),
      name,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('skills', skillInserts);

    const skills = await queryInterface.sequelize.query('SELECT id, name FROM skills', { type: Sequelize.QueryTypes.SELECT });
    const skillByName = {};
    skills.forEach((s) => { skillByName[s.name] = s.id; });

    const downtown = locByName['Coastal Eats Downtown'];
    const harbor = locByName['Coastal Eats Harbor'];
    const east = locByName['Coastal Eats East'];
    const west = locByName['Coastal Eats West'];
    const m1 = userById['manager1@coastaleats.com'];
    const m2 = userById['manager2@coastaleats.com'];
    await queryInterface.bulkInsert('manager_locations', [
      { id: crypto.randomUUID(), user_id: m1, location_id: downtown, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), user_id: m1, location_id: harbor, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), user_id: m2, location_id: east, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), user_id: m2, location_id: west, created_at: now, updated_at: now },
    ]);

    const staffEmails = userInserts.filter((u) => u.role === 'Staff').map((u) => u.email);
    for (const email of staffEmails) {
      const uid = userById[email];
      const locsForStaff = [downtown, harbor].slice(0, 1 + Math.floor(Math.random() * 2));
      for (const lid of locsForStaff) {
        await queryInterface.bulkInsert('staff_locations', [{
          id: crypto.randomUUID(),
          user_id: uid,
          location_id: lid,
          created_at: now,
          updated_at: now,
        }]);
      }
      const skillIds = Object.values(skillByName);
      const numSkills = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numSkills; i++) {
        await queryInterface.bulkInsert('staff_skills', [{
          id: crypto.randomUUID(),
          user_id: uid,
          skill_id: skillIds[i % skillIds.length],
          created_at: now,
          updated_at: now,
        }]);
      }
    }

    for (const email of staffEmails) {
      const uid = userById[email];
      await queryInterface.bulkInsert('desired_hours', [{
        id: crypto.randomUUID(),
        user_id: uid,
        weekly_hours: String(25 + Math.floor(Math.random() * 20)),
        effective_from: '2025-01-01',
        created_at: now,
        updated_at: now,
      }]);
    }

    for (const email of staffEmails.slice(0, 5)) {
      const uid = userById[email];
      for (let day = 1; day <= 5; day++) {
        await queryInterface.bulkInsert('availabilities', [{
          id: crypto.randomUUID(),
          user_id: uid,
          location_id: null,
          day_of_week: day,
          start_time: '09:00',
          end_time: '17:00',
          created_at: now,
          updated_at: now,
        }]);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('availabilities', {});
    await queryInterface.bulkDelete('desired_hours', {});
    await queryInterface.bulkDelete('staff_skills', {});
    await queryInterface.bulkDelete('staff_locations', {});
    await queryInterface.bulkDelete('manager_locations', {});
    await queryInterface.bulkDelete('skills', {});
    await queryInterface.bulkDelete('locations', {});
    await queryInterface.bulkDelete('users', {});
  },
};
