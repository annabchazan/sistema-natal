// Aplica um arquivo de migration num banco MySQL, com checagens antes.
// A senha é digitada no terminal (não aparece na tela nem fica em arquivo).
// Propositalmente NÃO lê o .env.local: o alvo tem que ser dito na linha de comando,
// pra não aplicar no banco errado por engano.
//
// Uso:
//   node scripts/aplicar-migration.mjs --host H --user U --db D --arquivo migration_v13.sql
//   node scripts/aplicar-migration.mjs --host H --user U --db D --testar-ssl
// Opções: --port 3306  --ssl (conecta com TLS verificado)
import fs from "node:fs";
import readline from "node:readline";
import mysql from "mysql2/promise";

const args = process.argv.slice(2);
const opcao = (nome) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (nome) => args.includes(`--${nome}`);

const host = opcao("host");
const user = opcao("user");
const database = opcao("db");
const port = Number(opcao("port") ?? 3306);
const arquivo = opcao("arquivo");
const testarSsl = flag("testar-ssl");

if (!host || !user || !database || (!arquivo && !testarSsl)) {
  console.error("Uso: node scripts/aplicar-migration.mjs --host H --user U --db D --arquivo migration_v13.sql");
  console.error("     node scripts/aplicar-migration.mjs --host H --user U --db D --testar-ssl");
  process.exit(2);
}

function perguntar(texto, { oculto = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (oculto) {
      rl._writeToOutput = (s) => {
        if (s.includes(texto)) rl.output.write(s);
      };
    }
    rl.question(texto, (resposta) => {
      rl.close();
      if (oculto) process.stdout.write("\n");
      resolve(resposta);
    });
  });
}

const password = await perguntar(`Senha do banco ${user}@${host}: `, { oculto: true });

async function conectar(comSsl) {
  return mysql.createConnection({
    host,
    user,
    password,
    database,
    port,
    connectTimeout: 15000,
    multipleStatements: false,
    ssl: comSsl ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
  });
}

if (testarSsl) {
  try {
    const conn = await conectar(true);
    const [rows] = await conn.query("SHOW STATUS LIKE 'Ssl_cipher'");
    console.log("SSL FUNCIONA. Cipher:", rows[0]?.Value || "(vazio)");
    await conn.end();
  } catch (err) {
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("LOGIN RECUSADO (ER_ACCESS_DENIED_ERROR). Isso NÃO é problema de SSL: nada foi testado ainda.");
      console.log("Causas prováveis: senha digitada errada, ou o seu IP não está liberado em 'MySQL remoto' no hPanel da Hostinger.");
    } else {
      console.log("SSL NÃO funcionou com verificação de certificado:", err.code || err.message);
      console.log("(Erro de certificado: o servidor tem TLS mas sem CA confiável. Erro de handshake: não oferece TLS.)");
    }
    process.exitCode = 1;
  }
  process.exit();
}

let conn;
try {
  conn = await conectar(flag("ssl"));
} catch (err) {
  if (err.code === "ER_ACCESS_DENIED_ERROR") {
    console.error("LOGIN RECUSADO. Confira a senha, ou se o seu IP está liberado em 'MySQL remoto' no hPanel. Nada foi alterado.");
  } else {
    console.error(`Não conectou: ${err.code || ""} ${err.message}`);
  }
  process.exit(1);
}
const [[info]] = await conn.query("SELECT DATABASE() AS banco, VERSION() AS versao");
console.log(`\nConectado. Banco: ${info.banco} (MySQL ${info.versao})`);

const [colId] = await conn.query("SHOW COLUMNS FROM usuarios LIKE 'id'");
const tipoId = String(colId[0]?.Type ?? "");
console.log(`Tipo de usuarios.id: ${tipoId}`);
if (!/^int(\(\d+\))?$/i.test(tipoId)) {
  console.error("PARE: usuarios.id não é INT com sinal; a chave estrangeira da migration não casa. Nada foi alterado.");
  await conn.end();
  process.exit(1);
}

const [antes] = await conn.query("SHOW TABLES");
const nomesAntes = antes.map((r) => Object.values(r)[0]);
console.log(`Tabelas hoje (${nomesAntes.length}): ${nomesAntes.join(", ")}`);
const [[{ n: totalUsuarios }]] = await conn.query("SELECT COUNT(*) AS n FROM usuarios");
console.log(`Usuários cadastrados: ${totalUsuarios}`);

const sql = fs
  .readFileSync(arquivo, "utf8")
  .split("\n")
  .filter((linha) => !linha.trim().startsWith("--"))
  .join("\n");
const comandos = sql.split(/;\s*(?:\n|$)/).map((c) => c.trim()).filter(Boolean);
console.log(`\n${arquivo}: ${comandos.length} comando(s):`);
comandos.forEach((c, i) => console.log(`  ${i + 1}. ${c.replace(/\s+/g, " ").slice(0, 90)}${c.length > 90 ? "…" : ""}`));

const resposta = await perguntar(`\nAplicar em ${info.banco}@${host}? Digite SIM para confirmar: `);
if (resposta.trim() !== "SIM") {
  console.log("Cancelado. Nada foi alterado.");
  await conn.end();
  process.exit(0);
}

for (const [i, comando] of comandos.entries()) {
  try {
    const [res] = await conn.query(comando);
    console.log(`  ${i + 1}. OK${res?.affectedRows !== undefined ? ` (linhas afetadas: ${res.affectedRows})` : ""}`);
  } catch (err) {
    console.error(`  ${i + 1}. ERRO: ${err.code} ${err.message}`);
    console.error("Parei aqui. Me mande esta mensagem (sem a senha).");
    await conn.end();
    process.exit(1);
  }
}

const [depois] = await conn.query("SHOW TABLES");
const nomesDepois = depois.map((r) => Object.values(r)[0]);
console.log(`\nTabelas agora (${nomesDepois.length}): ${nomesDepois.join(", ")}`);
console.log(`Novas: ${nomesDepois.filter((n) => !nomesAntes.includes(n)).join(", ") || "(nenhuma; já existiam)"}`);
await conn.end();
console.log("\nPronto.");
