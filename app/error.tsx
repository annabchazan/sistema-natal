"use client";

import TelaErro from "@/app/components/TelaErro";

// Erros nas páginas: aparece dentro do layout, com header e footer.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <TelaErro error={error} retry={retry} />;
}
