import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ehErroDeVersaoAntiga, recarregarUmaVez } from "@/app/utils/erroDeVersao";

function erro(message: string, name = "Error") {
  const e = new Error(message);
  e.name = name;
  return e;
}

describe("ehErroDeVersaoAntiga", () => {
  it("reconhece chunk e Server Action que sumiram depois de um deploy", () => {
    expect(ehErroDeVersaoAntiga(erro("Loading chunk 123 failed.", "ChunkLoadError"))).toBe(true);
    expect(ehErroDeVersaoAntiga(erro("Loading CSS chunk app-layout failed"))).toBe(true);
    expect(ehErroDeVersaoAntiga(erro("Failed to fetch dynamically imported module: /_next/x.js"))).toBe(true);
    expect(ehErroDeVersaoAntiga(erro("Importing a module script failed."))).toBe(true);
    expect(ehErroDeVersaoAntiga(erro('Failed to find Server Action "abc". This request might be from an older or newer deployment.'))).toBe(true);
  });

  it("não confunde com erros comuns", () => {
    expect(ehErroDeVersaoAntiga(erro("Cannot read properties of undefined (reading 'some')", "TypeError"))).toBe(false);
    expect(ehErroDeVersaoAntiga(erro("Failed to fetch", "TypeError"))).toBe(false);
  });
});

describe("recarregarUmaVez", () => {
  let armazenado: Record<string, string>;
  const reload = vi.fn();

  beforeEach(() => {
    armazenado = {};
    reload.mockReset();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => armazenado[k] ?? null,
      setItem: (k: string, v: string) => {
        armazenado[k] = v;
      },
    });
    vi.stubGlobal("window", { location: { reload } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("recarrega na primeira vez e não repete em seguida (evita loop)", () => {
    expect(recarregarUmaVez()).toBe(true);
    expect(recarregarUmaVez()).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("volta a recarregar depois de 30s", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-01T10:00:00Z"));
    expect(recarregarUmaVez()).toBe(true);
    vi.setSystemTime(new Date("2026-12-01T10:00:31Z"));
    expect(recarregarUmaVez()).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("não recarrega se o sessionStorage não estiver disponível", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
    });
    expect(recarregarUmaVez()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
