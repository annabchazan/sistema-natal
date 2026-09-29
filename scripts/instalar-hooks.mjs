// Aponta o git pra .githooks/ (roda no `npm install` via "prepare").
// Nunca falha: em ambientes sem git (ex.: build da Vercel) só não faz nada.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

try {
  if (existsSync(".git") && existsSync(".githooks")) {
    spawnSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "ignore" });
  }
} catch {
  // ignora
}
