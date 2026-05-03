import { useState } from "react";
import Sidebar from "./Sidebar";
import ListaObras from "./ListaObras";
import VistaStock from "./VistaStock";
import VistaFinanciero from "./VistaFinanciero";

export default function HomeView({ obras, uid, userNombre, onSelectObra, onEliminar }) {
  const [activeView,  setActiveView]  = useState("obras");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} activeView={activeView} onSetView={setActiveView} />
      <div className="md:ml-64 min-h-screen">
        {activeView === "obras" && (
          <ListaObras obras={obras} onSelect={onSelectObra} onEliminar={onEliminar}
            uid={uid} userNombre={userNombre} onOpenSidebar={() => setSidebarOpen(true)} />
        )}
        {activeView === "stock" && (
          <VistaStock obras={obras} onOpenSidebar={() => setSidebarOpen(true)} />
        )}
        {activeView === "financiero" && (
          <VistaFinanciero obras={obras} onOpenSidebar={() => setSidebarOpen(true)} />
        )}
      </div>
    </>
  );
}
