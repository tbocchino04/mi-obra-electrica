import { useState } from "react";
import Sidebar from "./Sidebar";
import ListaObras from "./ListaObras";
import VistaStock from "./VistaStock";
import VistaFinanciero from "./VistaFinanciero";
import NotificacionesPanel from "./NotificacionesPanel";
import NotifBanner from "./NotifBanner";

export default function HomeView({ obras, uid, userNombre, onSelectObra, onEliminar, notifs = [], noLeidas = 0 }) {
  const [activeView,  setActiveView]  = useState("obras");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <NotifBanner uid={uid} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onSetView={setActiveView}
        uid={uid}
        notifs={notifs}
        noLeidas={noLeidas}
        obras={obras}
        onSelectObra={onSelectObra}
      />
      <div className="md:ml-64 min-h-screen">
        {activeView === "obras" && (
          <ListaObras obras={obras} onSelect={onSelectObra} onEliminar={onEliminar}
            uid={uid} userNombre={userNombre} onOpenSidebar={() => setSidebarOpen(true)}
            notifs={notifs} noLeidas={noLeidas} />
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
