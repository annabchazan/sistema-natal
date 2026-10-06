// Estado de instalação do app no celular. O Chrome (Android) dispara
// `beforeinstallprompt` uma vez, logo no carregamento da página — muitas vezes
// antes do login, quando o banner ainda não aparece. Por isso o evento é
// capturado aqui, num módulo que o layout raiz carrega em toda página (via
// InstalarAppBanner, mesmo deslogado), e o banner só lê o estado guardado. No
// iOS não existe esse evento: a instalação é manual (Compartilhar → Adicionar
// à Tela de Início).

export type PlataformaInstalacao = "android" | "ios-safari" | "ios-outro-navegador" | "nenhuma";

// Evento não padronizado do Chrome; fora do lib.dom do TypeScript.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISPENSADO_KEY = "natal:instalar-app:dispensado";
const DISPENSA_DIAS = 30;

// Navegadores que no iOS não oferecem "Adicionar à Tela de Início" (ou são embutidos em outros apps).
const IOS_NAO_SAFARI = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\/|MicroMessenger|Twitter/i;

/**
 * Qual caminho de instalação vale pra este aparelho. `temPromptNativo` é se o
 * Chrome já entregou o `beforeinstallprompt` (só Android/desktop).
 */
export function detectarPlataforma(
  userAgent: string,
  maxTouchPoints: number,
  temPromptNativo: boolean,
): PlataformaInstalacao {
  // iPadOS 13+ se identifica como Macintosh; o toque diferencia de um Mac.
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (ios) return IOS_NAO_SAFARI.test(userAgent) ? "ios-outro-navegador" : "ios-safari";
  if (/Android/.test(userAgent) && temPromptNativo) return "android";
  return "nenhuma";
}

export function estaInstalado(): boolean {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const standaloneIos = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || standaloneIos;
}

export function foiDispensado(agora = Date.now()): boolean {
  try {
    const salvo = Number(localStorage.getItem(DISPENSADO_KEY));
    return Number.isFinite(salvo) && salvo > 0 && agora - salvo < DISPENSA_DIAS * 86_400_000;
  } catch {
    return false;
  }
}

export function dispensar(): void {
  try {
    localStorage.setItem(DISPENSADO_KEY, String(Date.now()));
  } catch {
    // Sem storage (aba anônima restrita): o banner volta na próxima visita, sem quebrar nada.
  }
}

let promptAdiado: BeforeInstallPromptEvent | null = null;
const ouvintes = new Set<() => void>();

function avisar() {
  ouvintes.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // segura o mini-aviso do Chrome pra mostrarmos o nosso
    promptAdiado = event as BeforeInstallPromptEvent;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    promptAdiado = null;
    avisar();
  });
}

export function assinarInstalacao(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function temPromptNativo(): boolean {
  return promptAdiado !== null;
}

/** Abre o diálogo nativo de instalação. Devolve true se a pessoa aceitou. */
export async function instalarAgora(): Promise<boolean> {
  if (!promptAdiado) return false;
  const evento = promptAdiado;
  promptAdiado = null; // o evento só pode ser usado uma vez
  avisar();
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome === "accepted";
}
