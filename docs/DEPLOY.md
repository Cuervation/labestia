# Deploy - La Bestia

Deploy manual previsto: Firebase Hosting + Firestore Rules.

## Variables Vite

1. Crear una Web App en Firebase Console.
2. Copiar `.env.local.example` a `.env.local`.
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
Guardar `.env.local` como UTF-8 sin BOM para que Vite lea bien `VITE_FIREBASE_*`.

Si no creás `.env.local`, La Bestia sigue funcionando en modo local/offline con ranking en el navegador.

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
- Confirmar que `scores` guarda `score`, `maxCombo`, `carsDestroyed`, `durationSeconds` y `createdAt`.
- Confirmar que `leaderboard/{uid}` se crea o actualiza solo si mejora `bestScore`.
- Confirmar que `leaderboard/{uid}` guarda `carsDestroyed` cuando el best score mejora.
- Abrir `/ranking` y validar top 20 ordenado por `bestScore` desc.

## Prueba local sin Firebase

```bash
npm install
npm run dev
```

Checklist:

- No crear `.env.local`.
- Jugar una partida en `/play`.
- Verificar que el score se guarda localmente.
- Abrir `/ranking` y validar que se muestra ranking local.
- Confirmar que no hay crash aunque Firebase no esté configurado.

## Build y preview

```bash
npm run typecheck
npm run build
npm run preview
```

Si querés probar preview en red local:

```bash
npm run preview -- --host 0.0.0.0
```

## Deploy Hosting

```bash
firebase login
firebase use --add
npm run build
npm run deploy:hosting
```

## Deploy reglas Firestore

```bash
npm run deploy:rules
```

## Config validada

- `firebase.json` sirve `dist/`.
- Rewrite SPA: `** -> /index.html`.
- `npm run deploy:hosting` ejecuta `firebase deploy --only hosting`.
- `npm run deploy:rules` ejecuta `firebase deploy --only firestore:rules`.
- Firestore usa `firestore.rules`.

## Notas

- No subir credenciales reales al repo.
- No deployar sin revisar reglas Firestore.
- La app debe seguir siendo jugable sin Firebase configurado, usando fallback local claro y sin alerts molestos.
- Si `firebase` CLI no está instalado, instalarlo o usar `npx firebase-tools`.
- En producción, agregar el dominio de Firebase Hosting a **Authentication > Settings > Authorized domains** si Google Login falla.

## QA de producción

Después del deploy:

- Abrir `/` y verificar portada + botón JUGAR.
- Abrir `/play` directo y refrescar: la SPA debe seguir funcionando.
- Abrir `/ranking` directo y refrescar: la SPA debe seguir funcionando.
- Verificar carga de assets.
- Probar login con Google en el dominio publicado.
- Jugar una partida logueado y confirmar `scores` + `leaderboard`.
- Cerrar sesión y confirmar que el fallback local sigue jugable.
