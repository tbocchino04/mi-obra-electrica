import { useState } from "react";
import { Loader2, Sun, Moon } from "lucide-react";
import AvanzaLogo from "./AvanzaLogo";
import { login, registrar, resetPassword } from "../firebase";
import { useTheme } from "../hooks/useTheme";
import { traducirError } from "../utils/helpers";

export default function AuthScreen() {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [nombre,   setNombre]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [resetSent, setResetSent] = useState(false);
  const { dark, toggle }        = useTheme();

  async function submit() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true); setError("");
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        if (!nombre.trim()) { setError("Ingresá tu nombre"); setLoading(false); return; }
        await registrar(email.trim(), password, nombre.trim());
      }
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) { setError("Ingresá tu email primero"); return; }
    setLoading(true); setError("");
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (err) {
      setError(traducirError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-ink-50 dark:bg-ink flex flex-col items-center justify-center px-5 py-6 gap-5">
      <div className="bg-white dark:bg-ink-900 rounded-3xl p-10 w-full max-w-sm border border-ink-200 dark:border-ink-700 animate-[slideUp_.22s_ease-out_both]">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 bg-violet-100 dark:bg-violet-900/40 rounded-xl mb-4">
            <AvanzaLogo size={22} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div className="logo-word text-[11px] uppercase text-violet-600 dark:text-violet-400 mb-1.5">AVANZA</div>
          <div className="font-bold text-[22px] text-ink dark:text-ink-50 tracking-[-0.04em] leading-tight">
            {mode === "login" ? "Bienvenido" : "Crear cuenta"}
          </div>
        </div>

        {resetSent ? (
          <div className="text-center">
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-6 leading-relaxed">
              Te enviamos un email a <strong>{email}</strong> con el link para restablecer tu contraseña.
            </div>
            <button onClick={() => { setResetSent(false); setError(""); }}
              className="w-full py-3.5 rounded-xl font-bold text-sm border-0 cursor-pointer bg-ink dark:bg-white text-white dark:text-ink">
              Volver al login
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2.5">
              {mode === "register" && (
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"
                  className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-400 outline-none focus:border-violet-500 transition-colors" />
              )}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-400 outline-none focus:border-violet-500 transition-colors" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña"
                onKeyDown={e => e.key === "Enter" && submit()}
                className="w-full px-3.5 py-3 rounded-xl border border-ink-200 dark:border-ink-700 text-sm bg-ink-50 dark:bg-ink-800 text-ink dark:text-ink-50 placeholder-ink-400 outline-none focus:border-violet-500 transition-colors" />
            </div>

            {error && <div className="mt-3 text-sm text-red-500 text-center font-medium">{error}</div>}

            <button onClick={submit} disabled={loading || !email.trim() || !password.trim()}
              className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm border-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-ink dark:bg-white text-white dark:text-ink flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Ingresando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
            </button>

            {mode === "login" && (
              <button onClick={handleReset} disabled={loading}
                className="w-full mt-2 bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer text-sm py-1.5 hover:text-ink-600 dark:hover:text-ink-300 transition-colors disabled:opacity-40">
                Olvidé mi contraseña
              </button>
            )}

            <button onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); }}
              className="w-full mt-1 bg-transparent border-0 text-ink-400 dark:text-ink-500 cursor-pointer text-sm font-medium py-2">
              {mode === "login" ? "¿No tenés cuenta? Registrarte" : "¿Ya tenés cuenta? Ingresar"}
            </button>
          </>
        )}
      </div>

      <button onClick={toggle}
        className="flex items-center gap-2 text-sm font-medium text-ink-400 dark:text-ink-500 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-700 rounded-full px-4 py-2 cursor-pointer">
        {dark ? <Sun size={14} /> : <Moon size={14} />}
        {dark ? "Modo claro" : "Modo oscuro"}
      </button>
    </div>
  );
}
