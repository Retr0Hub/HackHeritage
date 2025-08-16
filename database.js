// database.js
import knex from 'knex';

// Configure the database connection to use a local file
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './soulspeak.sqlite3', // The database will be a single file
  },
  useNullAsDefault: true,
});

// Function to create database tables if they don't exist
export async function setupDatabase() {
  try {
    if (!(await db.schema.hasTable('caretakers'))) {
      await db.schema.createTable('caretakers', (table) => {
        table.increments('id').primary();
        table.string('email').unique().notNullable();
        table.string('password').notNullable();
        table.string('mobileNumber').notNullable();
      });
      console.log("Created 'caretakers' table.");
    }

    if (!(await db.schema.hasTable('patients'))) {
      await db.schema.createTable('patients', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('pin').unique().notNullable();
        table.integer('caretakerId').unsigned().references('id').inTable('caretakers');
      });
      console.log("Created 'patients' table.");
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

export default db;