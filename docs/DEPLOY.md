# Deploy - La Bestia

Deploy manual previsto: Firebase Hosting + Firestore Rules.

## Variables Vite

1. Crear una Web App en Firebase Console.
2. Copiar `.env.example` a `.env.local`.
3. Completar:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

No commitear `.env.local`.

## Prueba local con Firebase real

```bash
npm install
npm run dev
```

Checklist:

- Entrar con Google.
- Jugar una partida hasta el game over.
- Confirmar que se crea `users/{uid}`.
- Confirmar que se crea un documento en `scores`.
- Confirmar que `leaderboard/{uid}` se crea o actualiza solo si mejora `bestScore`.
- Abrir `/ranking` y validar top 20 ordenado por `bestScore` desc.

## Build y preview

```bash
npm run typecheck
npm run build
npm run preview
```

## Deploy Hosting

```bash
firebase login
firebase use <project-id>
npm run build
npm run deploy:hosting
```

## Deploy reglas Firestore

```bash
firebase deploy --only firestore:rules
```

## Config validada

- `firebase.json` sirve `dist/`.
- Rewrite SPA: `** -> /index.html`.
- `npm run deploy:hosting` ejecuta `firebase deploy --only hosting`.
- Firestore usa `firestore.rules`.

## Notas

- No subir credenciales reales al repo.
- No deployar sin revisar reglas Firestore.
- La app debe seguir siendo jugable sin Firebase configurado, pero login/ranking/guardado muestran error claro.
