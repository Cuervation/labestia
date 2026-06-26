import { create } from "zustand";
import { firebaseConfigError, logout as firebaseLogout, signInWithGoogle, subscribeToAuthChanges } from "../firebase";
import type { FirebaseUserProfile } from "../firebase";

type AuthStore = {
  user: FirebaseUserProfile | null;
  loading: boolean;
  statusMessage: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  clearStatusMessage: () => void;
};

function mapUser(user: { uid: string; displayName: string | null; photoURL: string | null }): FirebaseUserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? "Jugador anonimo",
    photoURL: user.photoURL ?? null,
  };
}

function getFriendlyAuthMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "No se pudo iniciar sesion.";

  if (firebaseConfigError) {
    return "Firebase no esta configurado. Podes jugar igual y guardar localmente.";
  }

  if (message.includes("auth/operation-not-allowed")) {
    return "Google Login todavia no esta habilitado en Firebase Console.";
  }

  if (message.includes("auth/popup-closed-by-user")) {
    return "Cerraste la ventana de Google antes de terminar el login.";
  }

  if (message.includes("auth/popup-blocked")) {
    return "El navegador bloqueo el popup de Google. Habilitalo e intenta otra vez.";
  }

  return "No se pudo iniciar sesion con Google. Revisa la configuracion de Firebase/Auth.";
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  statusMessage: null,
  login: async () => {
    set({ loading: true, statusMessage: null });

    try {
      const user = await signInWithGoogle();
      set({ user: mapUser(user), loading: false, statusMessage: null });
    } catch (unknownError) {
      set({
        loading: false,
        statusMessage: getFriendlyAuthMessage(unknownError),
      });
    }
  },
  logout: async () => {
    try {
      await firebaseLogout();
      set({ user: null, loading: false, statusMessage: null });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo cerrar sesion.";
      set({ loading: false, statusMessage: message });
    }
  },
  clearStatusMessage: () => set({ statusMessage: null }),
}));

export function startAuthStoreSync() {
  return subscribeToAuthChanges((user) => {
    useAuthStore.setState({
      user: user ? mapUser(user) : null,
      loading: false,
      statusMessage: null,
    });
  });
}
