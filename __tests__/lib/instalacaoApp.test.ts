import { describe, expect, it } from "vitest";

import { detectarPlataforma, foiDispensado } from "@/app/utils/instalacaoApp";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1";
const IPHONE_INSTAGRAM =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0";
const IPHONE_WEBVIEW =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

describe("detectarPlataforma", () => {
  it("iPhone no Safari mostra o passo a passo manual", () => {
    expect(detectarPlataforma(IPHONE_SAFARI, 5, false)).toBe("ios-safari");
  });

  it("iPhone em Chrome ou navegador embutido pede pra abrir no Safari", () => {
    expect(detectarPlataforma(IPHONE_CHROME, 5, false)).toBe("ios-outro-navegador");
    expect(detectarPlataforma(IPHONE_INSTAGRAM, 5, false)).toBe("ios-outro-navegador");
    expect(detectarPlataforma(IPHONE_WEBVIEW, 5, false)).toBe("ios-outro-navegador");
  });

  it("iPad (que se declara Macintosh) conta como iOS; Mac de verdade não", () => {
    expect(detectarPlataforma(MAC_SAFARI, 5, false)).toBe("ios-safari");
    expect(detectarPlataforma(MAC_SAFARI, 0, false)).toBe("nenhuma");
  });

  it("Android só mostra o banner quando o Chrome já liberou o prompt nativo", () => {
    expect(detectarPlataforma(ANDROID_CHROME, 5, true)).toBe("android");
    expect(detectarPlataforma(ANDROID_CHROME, 5, false)).toBe("nenhuma");
  });
});

describe("foiDispensado", () => {
  it("sem localStorage (servidor, aba restrita) não quebra e não esconde o banner", () => {
    expect(foiDispensado()).toBe(false);
  });
});
