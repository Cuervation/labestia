import { isFirebaseConfigured } from "../firebase";
import { useAuthStore } from "../store";

export function LoginButton() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const statusMessage = useAuthStore((state) => state.statusMessage);
  const clearStatusMessage = useAuthStore((state) => state.clearStatusMessage);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="auth-button-group">
      {!isFirebaseConfigured ? (
        <button className="arcade-button arcade-button--ghost" type="button" disabled title="Firebase no configurado">
          Modo local
        </button>
      ) : loading ? (
        <button className="arcade-button arcade-button--ghost" type="button" disabled>
          Cargando...
        </button>
      ) : user ? (
        <button className="arcade-button arcade-button--ghost" type="button" onClick={() => void logout()}>
          Salir ({user.displayName})
        </button>
      ) : (
        <button className="arcade-button arcade-button--ghost" type="button" onClick={() => void login()}>
          Entrar con Google
        </button>
      )}

      {!isFirebaseConfigured ? (
        <span className="auth-note">Demo local activa.</span>
      ) : statusMessage ? (
        <button className="auth-note auth-note--action" type="button" onClick={clearStatusMessage}>
          {statusMessage}
        </button>
      ) : user ? (
        <span className="auth-note">Sesion global activa.</span>
      ) : (
        <span className="auth-note">Inicia sesion para guardar en ranking global.</span>
      )}
    </div>
  );
}
