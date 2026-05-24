import { useState, useEffect } from "react";
import { escucharNotificaciones } from "../services/notificaciones";

export function useNotificaciones(uid) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!uid) return;
    return escucharNotificaciones(uid, setNotifs);
  }, [uid]);

  const noLeidas = notifs.filter(n => !n.leida).length;
  return { notifs, noLeidas };
}
