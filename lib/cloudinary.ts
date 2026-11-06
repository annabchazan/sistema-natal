import crypto from "crypto";

// Apagar imagem no Cloudinary NUNCA pode derrubar a operação principal (excluir cartinha,
// trocar foto, limpeza de campanha): estas funções não lançam erro, só registram no log.

const TAMANHO_LOTE = 10;

// Extrai o public_id de uma URL de entrega do Cloudinary, ou null se não for uma imagem
// nossa. Formato: https://res.cloudinary.com/<cloud>/image/upload/[transformações/][v123/]<id>.<ext>
export function extrairPublicId(url: string | null | undefined, cloudName?: string): string | null {
  if (!url || typeof url !== "string") return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null; // caminho relativo legado (ex.: /uploads/...) ou lixo
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return null;

  const partes = parsed.pathname.split("/").filter(Boolean);
  // [cloud, "image", "upload", ...resto]
  if (partes.length < 4 || partes[1] !== "image" || partes[2] !== "upload") return null;
  if (cloudName && partes[0] !== cloudName) return null;

  let resto = partes.slice(3);
  const iVersao = resto.findIndex((p) => /^v\d+$/.test(p));
  if (iVersao >= 0) {
    resto = resto.slice(iVersao + 1);
  } else if (resto.length > 1 && resto[0].includes(",")) {
    // transformação sem versão (ex.: w_200,h_200/id.jpg)
    resto = resto.slice(1);
  }
  if (resto.length === 0) return null;

  const caminho = decodeURIComponent(resto.join("/")).replace(/\.[A-Za-z0-9]+$/, "");
  return caminho || null;
}

// Devolve true se a imagem foi apagada (ou já não existia); false em qualquer falha.
export async function apagarImagem(url: string | null | undefined): Promise<boolean> {
  if (!url) return false;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const publicId = extrairPublicId(url, cloudName);
  if (!publicId) return false; // não é imagem nossa: nada a apagar

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(`Cloudinary: exclusão não executada (faltam credenciais) public_id=${publicId}`);
    return false;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    // Parâmetros em ordem alfabética, sem api_key; o segredo entra no fim.
    const signature = crypto
      .createHash("sha1")
      .update(`invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("invalidate", "true");
    formData.append("timestamp", String(timestamp));
    formData.append("api_key", apiKey);
    formData.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      console.error(`Cloudinary: falha ao apagar public_id=${publicId} status=${response.status}`);
      return false;
    }
    const data = (await response.json().catch(() => null)) as { result?: string } | null;
    if (data?.result === "ok" || data?.result === "not found") return true;
    console.error(`Cloudinary: resposta inesperada ao apagar public_id=${publicId} result=${data?.result}`);
    return false;
  } catch (err) {
    console.error(`Cloudinary: erro ao apagar public_id=${publicId}:`, err);
    return false;
  }
}

// Apaga várias imagens em pequenos lotes. Devolve quantas deram certo e quantas falharam.
export async function apagarImagens(
  urls: Array<string | null | undefined>,
): Promise<{ apagadas: number; falhas: number }> {
  const unicas = [...new Set(urls.filter((u): u is string => Boolean(u)))];
  let apagadas = 0;
  let falhas = 0;

  for (let i = 0; i < unicas.length; i += TAMANHO_LOTE) {
    const resultados = await Promise.all(unicas.slice(i, i + TAMANHO_LOTE).map((u) => apagarImagem(u)));
    for (const ok of resultados) {
      if (ok) apagadas++;
      else falhas++;
    }
  }
  return { apagadas, falhas };
}
