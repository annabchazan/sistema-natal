import mysql, { type Pool } from "mysql2/promise";

// Guardado em globalThis pra sobreviver ao hot-reload do Turbopack sem vazar conexões a cada reload.
const globalForDb = globalThis as unknown as { mysqlPool?: Pool };

const db =
  globalForDb.mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sistemanatal",
    port: parseInt(process.env.DB_PORT || "3306"),
    connectionLimit: 10,
    ssl:
      process.env.DB_SSL === "true"
        ? { minVersion: "TLSv1.2", rejectUnauthorized: true }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = db;
}

export default db;