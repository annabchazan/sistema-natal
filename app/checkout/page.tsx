import { getUsuarioAutenticado } from "@/lib/auth";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const usuario = await getUsuarioAutenticado();

  if (!usuario) {
    redirect("/login?next=/checkout");
  }

  return <CheckoutClient />;
}
