// Fica separado de lib/auth.ts pra o proxy poder importar sem puxar o banco.
// Em produção o prefixo __Host- obriga Secure + path=/ + sem Domain (o navegador recusa o resto).
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-sistema_natal_session" : "sistema_natal_session";
