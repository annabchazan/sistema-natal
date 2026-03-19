"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { salvarCartinha, CartinhaState } from "@/app/actions/cartinhas";
import { Instituicao, Tag } from "@/app/admin/cartinhas/page";

interface FormProps {
  instituicoes: Instituicao[];
  tags: Tag[];
  cartinha?: any;
  onSuccess?: () => void;
}
const initialState: CartinhaState = { success: false, message: "" };
export default function FormularioCartinha({
  instituicoes,
  tags,
  cartinha,
  onSuccess,
}: FormProps) {
  const [state, formAction] = useActionState(salvarCartinha, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [state.success, onSuccess, router]);

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={cartinha?.id ?? ""} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome da Criança
            </label>
            <input
              name="nome_crianca"
              type="text"
              required
              className="w-full p-2 border rounded-md"
              defaultValue={cartinha?.nome_crianca ?? ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Idade
            </label>
            <input
              name="idade"
              type="number"
              required
              className="w-full p-2 border rounded-md"
              defaultValue={cartinha?.idade ?? ""}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Presente Pedido
          </label>
          <input
            name="presente_pedido"
            type="text"
            required
            className="w-full p-2 border rounded-md"
            placeholder="Ex: Bola de futebol"
            defaultValue={cartinha?.presente_pedido ?? ""}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Texto da Cartinha
          </label>
          <textarea
            name="texto_cartinha"
            required
            rows={4}
            className="w-full p-2 border rounded-md"
            placeholder="Querido Papai Noel..."
            defaultValue={cartinha?.texto_cartinha ?? ""}
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instituição
            </label>
            <select
              name="instituicao_id"
              required
              className="w-full p-2 border rounded-md"
              defaultValue={cartinha?.instituicao_id ?? ""}
            >
              <option value="">Selecione uma instituição</option>
              {instituicoes.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Foto da Cartinha
            </label>
            <input
              name="foto_cartinha"
              type="file"
              accept="image/*"
              className="w-full p-2 border rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Data Limite para Entrega
            </label>
            <input
              name="data_limite_entrega"
              type="date"
              className="w-full p-2 border rounded-md"
              min={new Date().toISOString().split("T")[0]}
              defaultValue={cartinha?.data_limite_entrega ?? ""}
            />
            <p className="text-xs text-gray-500 mt-1">
              Quando o presente deve ser entregue
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categoria (Tag)
            </label>
            <select
              name="tag_id"
              className="w-full p-2 border rounded-md bg-white"
              defaultValue={cartinha?.tag_id ?? ""}
            >
              <option value="">Nenhuma</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              className="w-full p-2 border rounded-md bg-white"
              defaultValue={cartinha?.status ?? "disponivel"}
            >
              <option value="disponivel">Disponível</option>
              <option value="apadrinhada">Apadrinhada</option>
              <option value="conferida">Conferida</option>
              <option value="embrulhado">Embrulhado</option>
              <option value="reapadrinhado">Reapadrinhado</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Esse campo influencia apenas o painel administrativo.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition shadow-lg"
        >
          {cartinha ? "💾 Salvar Alterações" : "🎁 Cadastrar Cartinha"}
        </button>

        {state.message && (
          <div
            className={`p-4 rounded-lg text-sm text-center ${state.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {state.message}
          </div>
        )}
      </form>
    </>
  );
}
