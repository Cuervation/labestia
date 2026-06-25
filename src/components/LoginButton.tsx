import { isFirebaseConfigured } from "../firebase";
import { useAuthStore } from "../store";

export function LoginButton() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  if (!isFirebaseConfigured) {
    return (
      <button className="arcade-button arcade-button--ghost" type="button" disabled title="Firebase no configurado">
        Modo local
      </button>
    );
  }

  if (loading) {
    return (
      <button className="arcade-button arcade-button--ghost" type="button" disabled>
        Cargando...
      </button>
    );
  }

  if (user) {
    return (
      <button className="arcade-button arcade-button--ghost" type="button" onClick={() => void logout()}>
        Salir
      </button>
    );
  }

  return (
    <button className="arcade-button arcade-button--ghost" type="button" onClick={() => void login()}>
      Entrar con Google
    </button>
  );
}
