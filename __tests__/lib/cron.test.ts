import { describe, it, expect, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { cronAutorizado } from "@/lib/cron";

function req(authorization?: string) {
  return new NextRequest("http://localhost/api/cron/x", {
    headers: authorization === undefined ? {} : { authorization },
  });
}

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("cronAutorizado", () => {
  it("aceita o segredo correto no formato Bearer", () => {
    process.env.CRON_SECRET = "segredo-do-cron";
    expect(cronAutorizado(req("Bearer segredo-do-cron"))).toBe(true);
  });

  it("recusa segredo errado", () => {
    process.env.CRON_SECRET = "segredo-do-cron";
    expect(cronAutorizado(req("Bearer outro-segredo"))).toBe(false);
  });

  it("recusa sem o cabeçalho Authorization", () => {
    process.env.CRON_SECRET = "segredo-do-cron";
    expect(cronAutorizado(req())).toBe(false);
  });

  it("recusa o segredo sem o prefixo Bearer", () => {
    process.env.CRON_SECRET = "segredo-do-cron";
    expect(cronAutorizado(req("segredo-do-cron"))).toBe(false);
  });

  it("recusa segredo com letras de caixa diferente", () => {
    process.env.CRON_SECRET = "Segredo";
    expect(cronAutorizado(req("Bearer segredo"))).toBe(false);
  });

  it("falha fechada: sem CRON_SECRET configurado, nega tudo", () => {
    delete process.env.CRON_SECRET;
    expect(cronAutorizado(req("Bearer "))).toBe(false);
    expect(cronAutorizado(req("Bearer undefined"))).toBe(false);
    expect(cronAutorizado(req(""))).toBe(false);
    expect(cronAutorizado(req())).toBe(false);
  });

  it("CRON_SECRET vazio também nega", () => {
    process.env.CRON_SECRET = "";
    expect(cronAutorizado(req("Bearer "))).toBe(false);
  });
});
