# Training Please · app web

Panel de coach y plan semanal de cada atleta. Next.js en Vercel, login con Google (Firebase Auth), datos en Firestore y Firebase Admin SDK en rutas API privadas. Proyecto hecho desde cero con Claude Code. El diseño respeta el de la web original del plan de Claudia (rosa, celeste, amarillo y menta; Oswald y Nunito Sans; tarjetas por día con check y cuenta regresiva), con tres temas a elegir: rosa, azul y oscuro.

## Cómo funciona el acceso
- No hay invitación por enlace. El coach da de alta a cada atleta desde **Panel coach › Dar de alta** con su nombre y su correo de Google.
- Al entrar con Google, `/api/bootstrap` comprueba el correo (lista `ADMIN_EMAILS` o alta del coach), crea `users/{uid}` y pone el rol como *custom claim*. Un correo no registrado no entra.
- El atleta acepta disclaimer, términos y consentimiento de datos la primera vez (y de nuevo si cambia `LEGAL_VERSION` en `src/lib/legal.ts`). Puede revocarlo desde **Ajustes › Privacidad**; desde ese momento el coach deja de ver sus registros.

## Datos en Firestore
| Ruta | Qué guarda | Quién escribe |
|---|---|---|
| `users/{uid}` | rol, nombre, correo, tema, carrera objetivo, perfil, consentimiento vigente | servidor al crear; el atleta edita tema, perfil, carrera y consentimiento |
| `allowlist/{correo}` | altas manuales pendientes o usadas | solo servidor |
| `consents/{uid}/events/{id}` | evidencia: versión, finalidades, fecha, navegador, otorgado o revocado | atleta (solo agrega) |
| `plans/{uid}/weeks/{semanaISO}` | título, fase, objetivo, notas, marca de IA | coach |
| `plans/{uid}/weeks/{semanaISO}/sessions/{id}` | fecha, deporte, título, duración, distancia, RPE objetivo, instrucciones | coach |
| `logs/{uid}/entries/{sessionId}` | realizada, RPE real, comentario | atleta |

"No realizada" no se guarda: se calcula al leer. Una sesión sin marcar queda *pendiente* hasta el final del día siguiente y luego *no realizada*. El cumplimiento cuenta solo las sesiones principales (las extra y el descanso no).

## Puesta en marcha
1. **Firebase** (proyecto `trainingplease`, ya creado): activar Authentication › Google y Firestore (región sugerida `southamerica-east1` o `us-east1`). En Authentication › Settings › Authorized domains, agregar el dominio de Vercel.
2. **Reglas**: `npx firebase deploy --only firestore:rules --project <id>`.
3. **Vercel**: nuevo proyecto con este repo (raíz por defecto, framework Next.js). Variables de entorno (ver `.env.example`):
   - `NEXT_PUBLIC_FIREBASE_*`: opcionales; la configuración web del proyecto `trainingplease` ya está en `src/lib/firebase.ts`.
   - `FIREBASE_SERVICE_ACCOUNT`: el JSON de la cuenta de servicio (Configuración del proyecto › Cuentas de servicio › Generar nueva clave), pegado en una línea. **Nunca subirlo al repo**.
   - `ADMIN_EMAILS`: correos de Google de la coach y admins, separados por coma.
4. Entrar con la cuenta del coach, dar de alta a los atletas y pedirles que entren con Google.
5. Plan actual de Claudia: cuando ella haya entrado una vez, en Panel coach › Claudia aparece el botón **Cargar plan de Claudia (web anterior)** (solo si aún no tiene semanas). También se puede con `npm run seed:plan -- correo@gmail.com data/claudia-plan.json` y la cuenta de servicio.

## Datos de la web anterior
`data/claudia-plan.json` (semanas y sesiones) y `data/claudia-meta.json` (fases, mes a mes, "lo mejor de mí y mi reto", niveles de meta) guardan el contenido de la web estática de Claudia, que se retiró del repo. Sirven para cargar su plan y para construir más adelante las vistas "La meta" y "Lo mejor de mí".

## Desarrollo
```bash
npm install
npm run lint          # tipos
npm test              # fechas, estados y cumplimiento
npm run test:rules    # reglas de Firestore en el emulador (requiere Java)
cp .env.emulators.example .env.local && npm run dev:emu   # app completa con emuladores
```
Con emuladores, en la consola del navegador `__tpSignIn('coach@example.com')` inicia sesión sin la ventana de Google.

## Exportar e importar semanas

En la ficha de cada atleta (panel coach) hay dos paneles:

- **Exportar semana**: descarga o copia un JSON con el perfil del atleta, la semana elegida (y, si se marca, las 4 anteriores), sus sesiones y los registros (hecho, RPE real, comentario, fecha). Los registros solo se incluyen si el atleta tiene el consentimiento vigente.
- **Importar semana**: pega o sube un JSON con el formato de `scripts/seed-plan.mjs` (`[{ id, week, sessions }]`) o un archivo exportado. Muestra una vista previa y lo guarda por `/api/admin/plan` con el mismo comportamiento que el script: fusiona la semana y crea o reemplaza sus sesiones, sin borrar otras.
