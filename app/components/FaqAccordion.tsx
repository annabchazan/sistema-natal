"use client";

import { useState } from "react";

interface FaqItem {
  pergunta: string;
  resposta: string;
}

export default function FaqAccordion({ itens }: { itens: FaqItem[] }) {
  const [abertoIndex, setAbertoIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {itens.map((item, index) => {
        const aberto = abertoIndex === index;
        return (
          <div
            key={index}
            className="bg-white border border-stone-200 border-t-[3px] border-t-brand rounded-md overflow-hidden transition-shadow hover:shadow-[0_8px_24px_rgba(30,27,23,.08)]"
          >
            <button
              type="button"
              onClick={() => setAbertoIndex(aberto ? null : index)}
              aria-expanded={aberto}
              className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-cream-deep transition-colors"
            >
              <span className="flex items-baseline gap-3">
                <span className="text-[12px] font-bold text-brand-dark tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] font-bold text-ink">
                  {item.pergunta}
                </span>
              </span>
              <span
                className={`shrink-0 flex items-center justify-center text-brand transition-all duration-300 ${
                  aberto ? "rotate-180 text-brand-dark" : ""
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m6 9 6 6 6-6"
                  />
                </svg>
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 pl-13 text-[13.5px] text-stone-600 leading-6">
                  {item.resposta}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
