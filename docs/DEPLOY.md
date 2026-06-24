# Deploy — La Bestia

Deploy manual previsto: Firebase Hosting.

## Quick path

1. Instalar dependencias.
2. Loguearte en Firebase y vincular proyecto.
3. Generar `dist/`.
4. Ejecutar deploy manual.

## Variables Vite

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Pasos

```bash
npm install
firebase login
firebase init
npm run build
firebase deploy
```

## Scripts utiles

```bash
npm run build
npm run preview
npm run deploy
```

## Notas

- Hosting debe servir `dist/`.
- El rewrite SPA debe apuntar a `index.html`.
- No subir credenciales reales al repo.
- No deployar sin revisar reglas Firestore.
