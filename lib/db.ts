import mysql, { type Pool } from "mysql2/promise";

// Em dev, o Next.js (Turbopack/HMR) reavalia este módulo a cada hot-reload.
// Sem guardar o pool em globalThis, cada reload criaria um pool novo (10
// conexões extras) sem fechar o anterior, até estourar o limite do MySQL.
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
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = db;
}

export default db;