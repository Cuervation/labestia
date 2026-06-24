import { create } from "zustand";
import { logout as firebaseLogout, signInWithGoogle, subscribeToAuthChanges } from "../firebase";
import type { FirebaseUserProfile } from "../firebase";

type AuthStore = {
  user: FirebaseUserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

function mapUser(user: { uid: string; displayName: string | null; photoURL: string | null }): FirebaseUserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName ?? "Jugador anonimo",
    photoURL: user.photoURL ?? null,
  };
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  login: async () => {
    try {
      const user = await signInWithGoogle();
      set({ user: mapUser(user), loading: false });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo iniciar sesion.";
      window.alert(message);
      set({ loading: false });
    }
  },
  logout: async () => {
    try {
      await firebaseLogout();
      set({ user: null, loading: false });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : "No se pudo cerrar sesion.";
      window.alert(message);
      set({ loading: false });
    }
  },
}));

export function startAuthStoreSync() {
  return subscribeToAuthChanges((user) => {
    useAuthStore.setState({
      user: user ? mapUser(user) : null,
      loading: false,
    });
  });
}
