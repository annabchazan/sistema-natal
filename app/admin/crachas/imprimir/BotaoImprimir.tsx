"use client";

export default function BotaoImprimir() {
  return (
    <div className="max-w-4xl mx-auto mb-6 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-red-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-red-700 transition shadow-lg"
      >
        Imprimir / Salvar como PDF
      </button>
    </div>
  );
}
