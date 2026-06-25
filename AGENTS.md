# AGENTS.md

Proyecto: La Bestia

Este archivo contiene las instrucciones permanentes para Codex dentro de este repositorio.

La Bestia es un juego web arcade top-down de autos, desarrollado con:

* React
* TypeScript
* Vite
* Phaser
* Firebase Auth
* Firestore
* Firebase Hosting
* Zustand

El objetivo del proyecto es construir un juego en el que el jugador maneja una camioneta roja de fletes llamada "La Bestia", suma puntos chocando autos, genera combos por choques consecutivos y guarda puntajes en un ranking global.

---

## Modo de trabajo

Trabajar siempre con Spec Driven Development.

Antes de implementar, revisar la especificación correspondiente.

Flujo esperado:

1. Leer la spec.
2. Identificar archivos relevantes.
3. Decir qué archivos se van a tocar.
4. Hacer cambios mínimos.
5. Probar build o indicar cómo probar.
6. Responder con resumen claro.

---

## Documentos principales

Antes de hacer cambios relevantes, leer solo los documentos necesarios:

* docs/GAME_SPEC.md
* docs/ARCHITECTURE.md
* docs/FIREBASE_MODEL.md
* docs/GAME_BALANCE.md
* docs/ROADMAP.md
* docs/CODEX_HANDOFF.md si existe

No leer toda la documentación si el cambio es chico.

---

## Skills disponibles

Usar estos skills según el tipo de tarea:

* skills/token-saver.md
* skills/phaser-gameplay.md
* skills/firebase.md
* skills/reviewer.md

Para cambios chicos o visuales:

* Leer skills/token-saver.md.

Para gameplay:

* Leer skills/phaser-gameplay.md.
* Leer docs/GAME_SPEC.md.
* Leer docs/GAME_BALANCE.md.

Para Firebase:

* Leer skills/firebase.md.
* Leer docs/FIREBASE_MODEL.md.

Para QA, bugs generales o build:

* Leer skills/reviewer.md.

---

## Reglas generales

1. No reescribir archivos completos si solo hace falta cambiar una función o componente.
2. No agregar features fuera del pedido.
3. No cambiar arquitectura sin motivo.
4. No duplicar lógica.
5. No agregar librerías nuevas sin pedir confirmación.
6. No hardcodear credenciales, tokens ni secrets.
7. No modificar documentación grande salvo que el pedido sea documentar.
8. No inventar assets, rutas ni nombres de archivos.
9. No mezclar responsabilidades.
10. Mantener cambios acotados para ahorrar tokens.

---

## Separación obligatoria

React, Phaser y Firebase deben mantenerse separados.

### React

React maneja:

* páginas
* rutas
* layout
* login
* ranking
* perfil
* paneles UI
* escuchar eventos del juego

React no debe manejar:

* game loop
* física
* colisiones
* spawn de autos
* cálculo interno de gameplay

### Phaser

Phaser maneja:

* juego
* escena
* cámara
* movimiento
* físicas
* colisiones
* HUD del gameplay
* score durante la partida
* combo durante la partida
* timer

Phaser no debe importar Firebase.

Phaser no debe guardar datos directamente en Firestore.

### Firebase

Firebase maneja:

* login
* usuarios
* scores
* leaderboard
* hosting

Firebase no debe depender de Phaser.

---

## Comunicación React / Phaser

La comunicación entre Phaser y React debe hacerse por eventos.

Cuando termina una partida, Phaser debe emitir:

```ts
window.dispatchEvent(
  new CustomEvent("laBestia:gameOver", {
    detail: {
      score,
      maxCombo,
      carsDestroyed,
      durationSeconds
    }
  })
);
```

React escucha ese evento desde PlayPage o un componente relacionado.

React decide si guarda el score en Firebase.

---

## Ambigüedad y preguntas

Si el pedido del usuario es ambiguo, incompleto o puede interpretarse de más de una forma, no asumir.

Antes de modificar código, hacer una pregunta breve.

Preguntar si falta información sobre:

* qué pantalla tocar
* qué componente tocar
* qué comportamiento exacto espera
* si el cambio es visual, gameplay o Firebase
* qué archivo o asset debe usarse
* si aplica a desktop, mobile o ambos
* si afecta ranking, login, scoring o deploy

Regla:

* Si la ambigüedad puede causar cambios incorrectos, preguntar antes de tocar archivos.
* Si la ambigüedad es menor y hay una opción segura, indicar la suposición y avanzar.
* Nunca inventar assets, rutas, credenciales o reglas de negocio.
* No modificar más archivos de los necesarios.

Formato para aclarar:

"Antes de tocar código, necesito confirmar: [pregunta concreta]."

---

## Formato de respuesta obligatorio

Al terminar una tarea, responder siempre:

1. Archivos modificados
2. Qué se cambió
3. Cómo probar
4. Próximo paso recomendado

Si hubo errores:

1. Qué falló
2. Causa probable
3. Qué archivo revisar
4. Próximo comando sugerido

---

## Modelos recomendados

Usar modelos según complejidad:

### GPT-5.4 mini

Usar para:

* cambios chicos de UI
* CSS
* documentación
* README
* assets placeholders
* textos
* prompts
* tareas simples

Esfuerzo recomendado:

* bajo
* medio si hay varios archivos

### GPT-5.4

Usar para:

* Firebase
* Zustand
* integración React
* bugs moderados
* ranking
* rutas
* formularios
* deploy config

Esfuerzo recomendado:

* medio
* medio/alto si toca datos o auth

### GPT-5.5

Usar para:

* arquitectura
* Phaser gameplay
* físicas
* colisiones
* performance
* QA final
* bugs complejos
* integración grande

Esfuerzo recomendado:

* alto

---

## Reglas para cambios de UI

Para cambios de UI:

1. Leer skills/token-saver.md.
2. Revisar solo componentes y CSS relacionados.
3. No tocar Phaser.
4. No tocar Firebase.
5. No cambiar gameplay.
6. No agregar librerías UI pesadas.
7. Mantener estética arcade oscuro/rojo/amarillo.
8. Mantener responsive mobile.

Archivos probables:

* src/pages/*
* src/components/*
* src/styles/*
* public/assets/*
* src/assets/*

---

## Reglas para cambios de gameplay

Para cambios de gameplay:

1. Leer skills/phaser-gameplay.md.
2. Leer docs/GAME_SPEC.md.
3. Leer docs/GAME_BALANCE.md.
4. No tocar Firebase.
5. No tocar Auth.
6. No tocar Firestore.
7. No meter toda la lógica en GameScene.
8. Separar en systems/entities/config.
9. Mantener balance en archivos de config.

Archivos probables:

* src/game/LaBestiaGame.ts
* src/game/scenes/*
* src/game/entities/*
* src/game/systems/*
* src/game/config/*
* src/game/types/*

---

## Reglas para Firebase

Para cambios de Firebase:

1. Leer skills/firebase.md.
2. Leer docs/FIREBASE_MODEL.md.
3. No tocar Phaser.
4. No cambiar scoring.
5. No cambiar gameplay.
6. No hardcodear credenciales.
7. Usar variables Vite con prefijo VITE_.
8. Si faltan env vars, la app debe fallar de forma clara o degradar sin crashear.

Archivos probables:

* src/firebase/*
* src/store/authStore.ts
* src/components/LoginButton.tsx
* src/components/Leaderboard.tsx
* src/pages/RankingPage.tsx
* src/pages/ProfilePage.tsx
* firestore.rules

---

## Reglas para assets

Para assets:

1. No depender de imágenes externas para que compile.
2. Usar public/assets si son archivos estáticos usados por ruta pública.
3. Usar src/assets si son importados desde TypeScript.
4. Si falta un asset, usar fallback.
5. No romper Phaser si una imagen no carga.
6. No agregar assets enormes sin avisar.

---

## Reglas para Firebase credentials

Nunca guardar en el repo:

* API keys privadas
* tokens GitHub
* Firebase service accounts
* secrets
* contraseñas
* archivos .env reales

Sí se permite:

* .env.example
* nombres de variables
* instrucciones de configuración

---

## Reglas de Git

Antes de tareas grandes, sugerir checkpoint.

Comandos útiles:

```bash
git status
git add .
git commit -m "checkpoint: descripcion"
```

No hacer push sin que el usuario lo pida.

---

## Handoff

Si el contexto de Codex está bajo o la sesión está muy cargada, no iniciar tareas grandes.

Crear o actualizar:

* docs/CODEX_HANDOFF.md

El handoff debe incluir:

* estado actual
* qué se implementó
* qué funciona
* qué falta
* errores conocidos
* comandos para probar
* próximo paso recomendado

No agregar features durante un handoff.

---

## Comandos habituales

Para instalar:

```bash
npm install
```

Para correr local:

```bash
npm run dev
```

Para build:

```bash
npm run build
```

Para preview:

```bash
npm run preview
```

Para deploy:

```bash
npm run deploy
```

Si algún script no existe, revisar package.json antes de asumir.

---

## Criterio de éxito MVP

El MVP de La Bestia debe tener:

* HomePage con portada
* PlayPage con Phaser montado
* camioneta controlable
* autos enemigos
* colisiones
* puntaje
* combo
* timer de 90 segundos
* game over
* login con Google
* guardar partida
* ranking global top 20
* deploy en Firebase Hosting

---

## Prioridad actual

Prioridad 1:

* que compile

Prioridad 2:

* que el juego sea jugable

Prioridad 3:

* que Firebase guarde ranking

Prioridad 4:

* que se vea bien

Prioridad 5:

* mejoras visuales, partículas, sonido y polish

---

## Si hay duda

Preguntar antes de modificar.

No asumir.
