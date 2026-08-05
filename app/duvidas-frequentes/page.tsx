import FaqAccordion from "@/app/components/FaqAccordion";
import { FAQ_CARTINHAS } from "@/app/data/faqCartinhas";

export default function DuvidasFrequentes() {
  return (
    <div className="min-h-screen bg-cream py-14">
      <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-[26px] font-bold text-center text-ink tracking-tight mb-3">
            Dúvidas frequentes
          </h1>
          <p className="text-center text-[13.5px] text-stone-500 mb-8 max-w-lg mx-auto">
            Tire suas dúvidas sobre o apadrinhamento antes de escolher uma
            cartinha.
          </p>

          <FaqAccordion itens={FAQ_CARTINHAS} />

          <div className="border-l-[3px] border-brand bg-white rounded-md p-6 mt-6 text-center">
            <h2 className="text-sm font-bold text-ink mb-2">
              Ainda tem dúvidas?
            </h2>
            <p className="text-[13.5px] text-stone-600 mb-5">
              Nossa equipe está pronta para ajudar! Entre em contato conosco.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="mailto:contato@semprecrianca.org"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink text-white border border-ink px-5 py-2.5 rounded font-semibold text-[13px] hover:bg-white hover:text-ink transition-colors"
              >
                contato@semprecrianca.org
              </a>
              <a
                href="https://api.whatsapp.com/send/?phone=5521995720162&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-verde-natal text-white border border-verde-natal px-5 py-2.5 rounded font-semibold text-[13px] hover:opacity-90 transition-opacity"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
  );
}
