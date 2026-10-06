import { useCallback, useState, useSyncExternalStore } from "react";

import {
  assinarInstalacao,
  detectarPlataforma,
  dispensar,
  estaInstalado,
  foiDispensado,
  instalarAgora,
  temPromptNativo,
  type PlataformaInstalacao,
} from "@/app/utils/instalacaoApp";

type InstalarApp = {
  /** Qual passo a passo mostrar; "nenhuma" = não exibir o banner. */
  plataforma: PlataformaInstalacao;
  instalar: () => Promise<void>;
  dispensarBanner: () => void;
};

const nuncaMuda = () => () => {};

export function useInstalarApp(): InstalarApp {
  const promptDisponivel = useSyncExternalStore(assinarInstalacao, temPromptNativo, () => false);
  // No servidor (e na hidratação) não há navigator/localStorage: o banner só
  // aparece depois, no navegador — senão o HTML do servidor e o do cliente divergem.
  const noNavegador = useSyncExternalStore(nuncaMuda, () => true, () => false);
  const [escondido, setEscondido] = useState(false);

  const instalar = useCallback(async () => {
    if (await instalarAgora()) setEscondido(true);
  }, []);

  const dispensarBanner = useCallback(() => {
    dispensar();
    setEscondido(true);
  }, []);

  const plataforma =
    !noNavegador || escondido || estaInstalado() || foiDispensado()
      ? "nenhuma"
      : detectarPlataforma(navigator.userAgent, navigator.maxTouchPoints, promptDisponivel);

  return { plataforma, instalar, dispensarBanner };
}
