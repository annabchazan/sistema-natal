import { exigirPoliticaAceita, getUsuarioAutenticado } from "@/lib/auth";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const usuario = await getUsuarioAutenticado();

  if (!usuario) {
    redirect("/login?next=/checkout");
  }

  // O carrinho fica no localStorage do navegador: ir e voltar da tela de aceite não o apaga.
  exigirPoliticaAceita(usuario, "/checkout");

  return <CheckoutClient />;
}
