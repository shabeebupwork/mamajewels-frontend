import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: "127.0.0.1",
  port: 5432,
  database: "mamajewels",
  user: "n8n_user",
  password: process.env.DB_PASSWORD,
});
