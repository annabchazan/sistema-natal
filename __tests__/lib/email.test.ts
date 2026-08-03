import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: mockSend } };
  }),
}));

import {
  enviarEmailRecuperacaoSenha,
  enviarConfirmacaoApadrinhamento,
  enviarLembreteEntrega,
  enviarCancelamentoApadrinamento,
  enviarAvisoDesistenciaEquipe,
  enviarNotificacaoEntrega,
} from "@/lib/email";

const cartinhaFake = {
  nome_crianca: "Ana",
  presente_pedido: "Boneca",
  data_limite_entrega: null,
  numero_sequencial: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("enviarEmailRecuperacaoSenha", () => {
  it("chama o Resend com o e-mail do destinatário", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    await enviarEmailRecuperacaoSenha({ email: "a@b.com", linkRedefinicao: "https://x.com/token" });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.com" }),
    );
  });

  it("não lança erro quando o Resend falha", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "falhou" } });
    await expect(
      enviarEmailRecuperacaoSenha({ email: "a@b.com", linkRedefinicao: "https://x.com/token" }),
    ).resolves.not.toThrow();
  });

  it("não lança erro quando o Resend rejeita a chamada", async () => {
    mockSend.mockRejectedValue(new Error("timeout"));
    await expect(
      enviarEmailRecuperacaoSenha({ email: "a@b.com", linkRedefinicao: "https://x.com/token" }),
    ).resolves.not.toThrow();
  });
});

describe("enviarConfirmacaoApadrinhamento", () => {
  it("retorna ok: true quando o Resend envia com sucesso", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    const res = await enviarConfirmacaoApadrinhamento({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      cartinhas: [cartinhaFake],
    });
    expect(res.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "padrinho@teste.com",
        subject: expect.stringContaining("1 cartinha"),
      }),
    );
  });

  it("usa plural no assunto quando há mais de uma cartinha", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    await enviarConfirmacaoApadrinhamento({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      cartinhas: [cartinhaFake, cartinhaFake],
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("2 cartinhas") }),
    );
  });

  it("retorna ok: false quando o Resend retorna erro", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "falhou" } });
    const res = await enviarConfirmacaoApadrinhamento({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      cartinhas: [cartinhaFake],
    });
    expect(res.ok).toBe(false);
  });

  it("retorna ok: false quando o Resend lança exceção", async () => {
    mockSend.mockRejectedValue(new Error("timeout"));
    const res = await enviarConfirmacaoApadrinhamento({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      cartinhas: [cartinhaFake],
    });
    expect(res.ok).toBe(false);
  });
});

describe("enviarLembreteEntrega", () => {
  it("usa o assunto de prazo vencido quando tipo é 'vencido'", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    const res = await enviarLembreteEntrega({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      nomeCrianca: "Ana",
      presentePedido: "Boneca",
      dataLimite: null,
      numeroSequencial: 1,
      tipo: "vencido",
    });
    expect(res.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringMatching(/prazo vencido/i) }),
    );
  });

  it("usa o assunto de 10 dias quando tipo é '10d'", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    await enviarLembreteEntrega({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      nomeCrianca: "Ana",
      presentePedido: "Boneca",
      dataLimite: null,
      numeroSequencial: 1,
      tipo: "10d",
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringMatching(/10 dias/i) }),
    );
  });
});

describe("enviarCancelamentoApadrinamento", () => {
  it("envia para o e-mail do padrinho com o nome da criança no assunto", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    const res = await enviarCancelamentoApadrinamento({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      nomeCrianca: "Ana",
      presentePedido: "Boneca",
      numeroSequencial: 1,
    });
    expect(res.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "padrinho@teste.com", subject: expect.stringContaining("Ana") }),
    );
  });
});

describe("enviarAvisoDesistenciaEquipe", () => {
  it("envia para o e-mail fixo da equipe, não para o padrinho", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    const res = await enviarAvisoDesistenciaEquipe({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      nomeCrianca: "Ana",
      numeroSequencial: 1,
    });
    expect(res.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "cartinhas@semprecrianca.org" }),
    );
  });

  it("inclui o número sequencial no assunto quando presente", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    await enviarAvisoDesistenciaEquipe({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      nomeCrianca: "Ana",
      numeroSequencial: 7,
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("#7") }),
    );
  });

  it("não inclui '#' no assunto quando número sequencial é null", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    await enviarAvisoDesistenciaEquipe({
      nomePadrinho: "Padrinho Teste",
      emailPadrinho: "padrinho@teste.com",
      nomeCrianca: "Ana",
      numeroSequencial: null,
    });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.not.stringContaining("#") }),
    );
  });
});

describe("enviarNotificacaoEntrega", () => {
  it("envia para o padrinho com o primeiro nome no assunto", async () => {
    mockSend.mockResolvedValue({ data: { id: "1" }, error: null });
    const res = await enviarNotificacaoEntrega({
      nomePadrinho: "Padrinho Teste da Silva",
      emailPadrinho: "padrinho@teste.com",
      nomeCrianca: "Ana",
      presentePedido: "Boneca",
      numeroSequencial: 1,
    });
    expect(res.ok).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "padrinho@teste.com",
        subject: expect.stringContaining("Padrinho"),
      }),
    );
  });
});
