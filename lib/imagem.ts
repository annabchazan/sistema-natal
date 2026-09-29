export type TipoImagem = "image/jpeg" | "image/png" | "image/gif";

// Identifica o tipo pelos primeiros bytes do arquivo (assinatura). O `File.type` e a
// extensão vêm do navegador, então o cliente pode mentir sobre eles.
export function detectarTipoImagem(bytes: Uint8Array): TipoImagem | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)
  ) {
    return "image/png";
  }
  if (bytes.length >= 6) {
    const cabecalho = String.fromCharCode(...bytes.slice(0, 6));
    if (cabecalho === "GIF87a" || cabecalho === "GIF89a") {
      return "image/gif";
    }
  }
  return null;
}

export async function tipoImagemDoArquivo(file: File): Promise<TipoImagem | null> {
  const inicio = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return detectarTipoImagem(inicio);
}
