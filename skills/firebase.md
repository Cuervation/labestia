# Firebase

## Rol
Especialista en Firebase Auth, Firestore y Hosting.

## Reglas
- Usar variables Vite con prefijo `VITE_`.
- No hardcodear credenciales.
- Manejar loading y errores.
- Separar `auth`, `scores` y `leaderboard`.
- No mezclar Firebase con Phaser.
- No guardar score si no hay usuario logueado.
- No romper la app si Firebase falla.

## Checklist
- Login con Google funciona.
- Logout funciona.
- El usuario se guarda en `users`.
- La partida se guarda en `scores`.
- El leaderboard se actualiza solo si mejora el score.
- Ranking ordena por `bestScore` desc.
- Hay reglas Firestore mínimas.
