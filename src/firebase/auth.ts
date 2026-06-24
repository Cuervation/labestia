import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigError } from "./firebaseConfig";

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (!auth) {
    throw new Error(firebaseConfigError ?? "Firebase Auth no esta disponible.");
  }

  const credential = await signInWithPopup(auth, provider);
  await upsertUserProfile(credential.user);
  return credential.user;
}

export async function logout() {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await upsertUserProfile(user).catch((error: unknown) => {
        console.error("No se pudo actualizar el perfil de usuario.", error);
      });
    }

    callback(user);
  });
}

export async function upsertUserProfile(user: User) {
  if (!db) {
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const existingUser = await getDoc(userRef);

  await setDoc(
    userRef,
    {
      uid: user.uid,
      displayName: user.displayName ?? "Jugador anonimo",
      photoURL: user.photoURL ?? null,
      lastLoginAt: serverTimestamp(),
      ...(existingUser.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}
