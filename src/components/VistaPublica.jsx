import { useState, useEffect } from "react";
import { escucharObraPorToken } from "../firebase";
import { Spinner } from "./ui";
import VistaCliente from "./VistaCliente";

export default function VistaPublica({ token }) {
  const [obra, setObra] = useState(undefined);

  useEffect(() => {
    return escucharObraPorToken(token, setObra);
  }, [token]);

  if (obra === undefined) return <Spinner />;
  if (!obra) return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🔍</div>
        <div className="font-bold text-lg text-ink dark:text-ink-50 mb-2">Link inválido</div>
        <div className="text-sm text-ink-500 dark:text-ink-400">Este link de obra no existe o fue eliminado.</div>
      </div>
    </div>
  );

  return <VistaCliente etapas={obra.etapas || []} obraInfo={obra.obraInfo || {}} onVolver={null} esPublica obraId={obra.id} />;
}
