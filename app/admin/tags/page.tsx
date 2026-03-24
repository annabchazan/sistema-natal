import FormularioTags from "@/app/components/admin/Tag/FormularioTag";

export default function PaginaCadastroTag() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <FormularioTags />
      </div>
    </div>
  );
}
