export interface DadosUsuarioCadastro {
  nome: string;
  telefone: string;
  email: string;
  senha?: string;
}

export function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 11);
}

export function formatarTelefoneCelular(valor: string) {
  const numeros = normalizarTelefone(valor);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
}

export function telefoneEhCelular(valor: string) {
  const numeros = normalizarTelefone(valor);
  return numeros.length === 11 && numeros[2] === "9";
}

export function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}
