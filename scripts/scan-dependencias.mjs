// Auditoria de dependências do gate de segurança.
// Falha (exit 1) se houver vulnerabilidade moderate ou pior em dependência de produção.
// Sem internet, avisa e pula, pra não travar quem trabalha offline.
import { spawnSync } from "node:child_process";

const resultado = spawnSync("npm", ["audit", "--omit=dev", "--audit-level=moderate"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});

const saida = `${resultado.stdout ?? ""}${resultado.stderr ?? ""}`;

if (resultado.status === 0) {
  console.log("Auditoria de dependências: nenhuma vulnerabilidade moderate ou pior.");
  process.exit(0);
}

if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|audit endpoint returned an error|network/i.test(saida)) {
  console.warn("Auditoria de dependências PULADA: sem acesso ao registro npm (offline?).");
  process.exit(0);
}

console.error(saida);
console.error("Auditoria de dependências FALHOU. Corrija com `npm audit fix` (nunca com --force sem revisar).");
process.exit(1);
