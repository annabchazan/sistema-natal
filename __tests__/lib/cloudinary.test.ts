import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { extrairPublicId, apagarImagem, apagarImagens } from "@/lib/cloudinary";

const URL_BASE = "https://res.cloudinary.com/democloud/image/upload";

describe("extrairPublicId", () => {
  it("extrai o id de uma URL com versão", () => {
    expect(extrairPublicId(`${URL_BASE}/v1712345678/abc123.jpg`, "democloud")).toBe("abc123");
  });

  it("mantém a pasta no public_id", () => {
    expect(extrairPublicId(`${URL_BASE}/v1/natal/2026/foto.png`, "democloud")).toBe("natal/2026/foto");
  });

  it("ignora transformações antes da versão", () => {
    expect(extrairPublicId(`${URL_BASE}/w_200,h_200,c_fill/v1/abc.jpg`, "democloud")).toBe("abc");
  });

  it("aceita URL sem versão", () => {
    expect(extrairPublicId(`${URL_BASE}/abc.gif`, "democloud")).toBe("abc");
  });

  it("aceita URL sem extensão", () => {
    expect(extrairPublicId(`${URL_BASE}/v1/abc`, "democloud")).toBe("abc");
  });

  it("recusa outro cloud name (imagem que não é nossa)", () => {
    expect(extrairPublicId(`${URL_BASE}/v1/abc.jpg`, "outrocloud")).toBeNull();
  });

  it("recusa host que não é res.cloudinary.com", () => {
    expect(extrairPublicId("https://evil.com/democloud/image/upload/v1/abc.jpg", "democloud")).toBeNull();
    expect(extrairPublicId("http://res.cloudinary.com/democloud/image/upload/v1/abc.jpg", "democloud")).toBeNull();
  });

  it("recusa caminho legado, vazio, nulo e lixo", () => {
    expect(extrairPublicId("/uploads/cartinha_1.jpeg")).toBeNull();
    expect(extrairPublicId("")).toBeNull();
    expect(extrairPublicId(null)).toBeNull();
    expect(extrairPublicId(undefined)).toBeNull();
    expect(extrairPublicId("data:image/png;base64,AAAA")).toBeNull();
  });

  it("recusa URL que não é de imagem enviada", () => {
    expect(extrairPublicId("https://res.cloudinary.com/democloud/video/upload/v1/abc.mp4", "democloud")).toBeNull();
    expect(extrairPublicId("https://res.cloudinary.com/democloud/image/upload/", "democloud")).toBeNull();
  });
});

describe("apagarImagem", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "democloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "chave");
    vi.stubEnv("CLOUDINARY_API_SECRET", "segredo");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-06T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
              });

  function respostaOk(result = "ok") {
    return { ok: true, status: 200, json: async () => ({ result }) };
  }

  it("chama o destroy assinado com o public_id certo", async () => {
    fetchMock.mockResolvedValueOnce(respostaOk());
    const ok = await apagarImagem(`${URL_BASE}/v1/natal/abc.jpg`);

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.cloudinary.com/v1_1/democloud/image/destroy");
    expect(init.method).toBe("POST");

    const timestamp = Math.floor(new Date("2026-11-06T12:00:00Z").getTime() / 1000);
    const assinaturaEsperada = crypto
      .createHash("sha1")
      .update(`invalidate=true&public_id=natal/abc&timestamp=${timestamp}segredo`)
      .digest("hex");
    const form = init.body as FormData;
    expect(form.get("public_id")).toBe("natal/abc");
    expect(form.get("invalidate")).toBe("true");
    expect(form.get("timestamp")).toBe(String(timestamp));
    expect(form.get("api_key")).toBe("chave");
    expect(form.get("signature")).toBe(assinaturaEsperada);
    expect(form.get("api_secret")).toBeNull();
  });

  it("trata 'not found' como sucesso (a imagem já não existe)", async () => {
    fetchMock.mockResolvedValueOnce(respostaOk("not found"));
    expect(await apagarImagem(`${URL_BASE}/v1/abc.jpg`)).toBe(true);
  });

  it("resposta de erro HTTP devolve false e registra no log", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    expect(await apagarImagem(`${URL_BASE}/v1/abc.jpg`)).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("falha de rede não lança erro", async () => {
    fetchMock.mockRejectedValueOnce(new Error("rede caiu"));
    await expect(apagarImagem(`${URL_BASE}/v1/abc.jpg`)).resolves.toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("não chama a rede sem credenciais e registra o motivo", async () => {
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    expect(await apagarImagem(`${URL_BASE}/v1/abc.jpg`)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("não chama a rede para URL que não é nossa", async () => {
    expect(await apagarImagem("/uploads/velha.jpg")).toBe(false);
    expect(await apagarImagem(null)).toBe(false);
    expect(await apagarImagem("https://res.cloudinary.com/outro/image/upload/v1/x.jpg")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("o log de erro não vaza o segredo da API", async () => {
    fetchMock.mockRejectedValueOnce(new Error("falha"));
    await apagarImagem(`${URL_BASE}/v1/abc.jpg`);
    const textoLog = JSON.stringify(vi.mocked(console.error).mock.calls.map((c) => c.map(String)));
    expect(textoLog).not.toContain("segredo");
  });
});

describe("apagarImagens", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "democloud");
    vi.stubEnv("CLOUDINARY_API_KEY", "chave");
    vi.stubEnv("CLOUDINARY_API_SECRET", "segredo");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
              });

  it("conta sucessos e falhas, ignora nulos e duplicadas", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ result: "ok" }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

    const resultado = await apagarImagens([
      `${URL_BASE}/v1/a.jpg`,
      `${URL_BASE}/v1/b.jpg`,
      `${URL_BASE}/v1/a.jpg`,
      null,
      undefined,
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(resultado).toEqual({ apagadas: 1, falhas: 1 });
  });

  it("processa listas grandes em lotes sem perder nenhuma", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ result: "ok" }) });
    const urls = Array.from({ length: 25 }, (_, i) => `${URL_BASE}/v1/foto${i}.jpg`);
    expect(await apagarImagens(urls)).toEqual({ apagadas: 25, falhas: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(25);
  });

  it("lista vazia não faz nada", async () => {
    expect(await apagarImagens([])).toEqual({ apagadas: 0, falhas: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
