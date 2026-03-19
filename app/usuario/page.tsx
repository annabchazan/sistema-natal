import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/auth";

export default async function UsuarioPage() {
  const usuario = await getUsuarioAutenticado();

  if (!usuario) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-red-50 to-green-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
          <div className="bg-green-600 text-white p-8">
            <h1 className="text-3xl font-bold">Area do Usuario</h1>
            <p className="mt-2 text-green-100">
              Seus dados de cadastro estao prontos para uso.
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-red-50 border border-red-100 p-5">
                <p className="text-sm font-semibold text-red-700">Nome</p>
                <p className="mt-2 text-lg font-bold text-gray-800">
                  {usuario.nome}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 border border-green-100 p-5">
                <p className="text-sm font-semibold text-green-700">Celular</p>
                <p className="mt-2 text-lg font-bold text-gray-800">
                  {usuario.telefone}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-5">
              <p className="text-sm font-semibold text-blue-700">E-mail</p>
              <p className="mt-2 text-lg font-bold text-gray-800">
                {usuario.email}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Voltar para inicio
              </Link>

              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-green-700"
              >
                Ir para checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
