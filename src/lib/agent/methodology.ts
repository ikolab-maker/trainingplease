// Agente Ciencia (v1): la metodología que el agente principal debe seguir.
// Viene de 04-planes-entrenamiento.md y 06-analisis-semanal.md del proyecto.
// Cambiarla es una decisión del coach: se edita aquí y se sube la versión.

export const METHODOLOGY_VERSION = '2026-10-10';

export const METHODOLOGY = `
## Escala RPE (esfuerzo percibido 1–10)
- 2–3: muy suave, conversación fluida (calentamiento, recuperación)
- 4–5: suave, se habla en frases (rodaje, fondo)
- 6–7: moderado, frases cortas (tempo, ritmo de 21K)
- 8: duro, pocas palabras (ritmo de 10K, intervalos)
- 9–10: máximo, solo puntual; evitar en entrenamiento

## Reglas de decisión de la semana (en este orden)
| Situación de la semana | Decisión para la siguiente |
|---|---|
| Dolor > 3/10, cambio de pisada o molestia que se repite | Descarga y sugerir revisión profesional; nada de calidad |
| RPE real ≥ objetivo + 2 en 2 o más sesiones, o RPE ≥ 8 en un rodaje suave dos veces | Descarga |
| Cumplimiento < 70 % | Bajar 10–20 % y simplificar; preguntar la causa (tiempo, salud, motivación) |
| Cumplimiento 70–89 % | Mantener la carga (repetir estructura), sin subir |
| Cumplimiento ≥ 90 % y RPE en rango | Progresar según el plan, sin pasar de +10 % de km |
| Toca descarga por calendario (cada 3–4 semanas o la que fije su plan) | Descarga aunque vaya bien |

## Cómo ajustar
- Descarga: −30 a −40 % de km, sin calidad, fuerza ligera.
- Bajar: −10 a −20 %, menos sesiones.
- Mantener: misma carga; se pueden variar estímulos.
- Progresar: según el plan, máximo +10 % de km. Al volver de una descarga se puede regresar al volumen previo.
- Sin datos: seguir el plan previsto y decirlo.
- Nunca recortar el taper (las 1–2 semanas antes de la carrera). Tests y carreras mandan sobre el resto de la semana; los 2 días antes de un test bajan la carga.
- Fuerza de pierna intensa nunca 48 h antes de la sesión de calidad, el fondo o un test.
- Usar los días y el patrón que el atleta ya cumple; si saltó siempre el mismo día, moverlo.
- Cada sesión de carrera lleva RPE objetivo; ritmos solo si hay un tiempo de referencia reciente.
- Calidad (intervalos, tempo): 15 min de calentamiento a RPE 3–4 + progresivos, y 10 min de vuelta a la calma.
- Proyección de tiempos (Riegel): T2 = T1 × (D2/D1)^1,06.
- "Que un entrenamiento se sienta fácil no significa que haya que hacerlo más difícil."

## Límites
- No es consejo médico. Ante dolor que persiste, la indicación es parar y consultar a un profesional (fisioterapeuta o médico).
- El plan lo aprueba el coach; la propuesta se marca como asistida por IA.
`.trim();
