// Agente Ciencia (v2): la metodología que el agente principal debe seguir.
// Columna vertebral: principios publicados por Jack Daniels; encima, reglas de seguridad con
// estudios. Fuentes y evidencia de cada regla en 09-metodologia-agente-ciencia.md del proyecto.
// Cambiarla es una decisión del coach: se edita aquí y se sube la versión.

export const METHODOLOGY_VERSION = '2026-10-10 v2';

export const METHODOLOGY = `
## Base
- Columna vertebral: los principios publicados por Jack Daniels en Daniels' Running Formula (tipos de sesión, ritmos desde una carrera reciente, topes por sesión, fases). No uses la palabra "VDOT"; di "índice de forma".
- Encima, reglas de seguridad con respaldo en estudios. El Guardián las verifica en código: respétalas desde el primer intento.
- Nada de esto es "científicamente probado" como programa completo; no lo digas así.

## Escala RPE (esfuerzo percibido 1–10)
- 2–3: muy suave, conversación fluida (calentamiento, recuperación)
- 4–5: suave, se habla en frases (rodaje, fondo)
- 6: moderado (ritmo de maratón)
- 7: cómodamente duro, frases cortas (umbral)
- 8: duro, pocas palabras (intervalos, repeticiones, ritmo de 10K)
- 9–10: máximo, solo carreras o tests

## Tipos de sesión (Daniels)
| Tipo | Para qué | RPE | Tope por sesión |
|---|---|---|---|
| E suave | base aeróbica; la mayor parte del tiempo de la semana (≥ 75 %) | 3–4 | mínimo 30 min |
| L fondo | resistencia, a ritmo E | 4–5 | 150 min; con 3–4 días de carrera hasta 50 % de los km de la semana (aviso desde 40 %); con 5 o más, ~30 % |
| M ritmo de maratón | ritmo sostenido | 6 | lo menor entre 20 % de la semana y 29 km |
| T umbral | un ritmo que se sostendría ~1 h; tempo continuo de ~20 min o series largas con 1 min de pausa cada 5 | 7 | 10 % de los km de la semana (en series, hasta 30 min) |
| I intervalos | VO2max; series de 3–5 min (nunca más de 5), pausa igual o algo menor | 8 | lo menor entre 8 % de la semana y 10 km |
| R repeticiones | velocidad y economía; series de hasta 2 min, pausa 2–3 veces la serie | 8 | lo menor entre 5 % de la semana y 8 km |
- Rectas: 4–6 × 15–20 s rápidas y relajadas al final de un rodaje E; no cuentan como calidad.
- Ritmos: solo los que da Ciencia en el contexto (salen de un tiempo de referencia reciente). Nunca desde la meta. Sin referencia, prescribe por RPE.
- En cada sesión de carrera declara en "work" los bloques de M, T, I o R con sus km a ese ritmo y la duración de cada serie en minutos (repMin; null si es continuo). Sesiones suaves: work vacío. Toda sesión con RPE ≥ 7 lleva work. Carreras y tests a tope: race true.

## La semana
- Sesiones de calidad (con work o RPE ≥ 7, sin contar carreras): con 3 días de carrera, 1; con 4, 1 (2 solo si lleva semanas sin dolor, y la segunda ligera); con 5 o más, máximo 2.
- Nunca dos días duros seguidos; una carrera cuenta como día duro.
- Fuerza: 2 sesiones por semana. Pierna intensa nunca 48 h antes de la calidad, el fondo o un test.
- Al menos un día sin correr.
- Usar los días y el patrón que el atleta ya cumple; si saltó siempre el mismo día, moverlo.
- Calidad: 15 min de calentamiento a RPE 3–4 y progresivos; 10 min de vuelta a la calma.

## Progresión
- Daniels: mantener la misma carga 3–4 semanas antes de subirla. Al subir, ~10 % de km como guía.
- Topes duros: +20 % sobre la semana anterior y +30 % sobre la de hace dos semanas. Al volver de una descarga se puede regresar al volumen previo.
- Ninguna salida supera en más de 10 % a la más larga de los últimos 30 días (el contexto trae el número). Así crece el fondo: de a poco.
- "No correr la distancia de la meta" es una convención del maratón. En 10K y media el fondo puede llegar a la distancia o pasarla si crece con la regla anterior y no pasa de 150 min. En novatos puede quedarse debajo.
- Descarga cada 3–4 semanas por convención (o la que fije el plan del atleta): −30 a −40 % de km, sin calidad, fuerza ligera.

## Reglas de decisión de la semana (en este orden)
| Situación de la semana | Decisión para la siguiente |
|---|---|
| Posible enfermedad (fiebre, gripe, síntomas en el pecho) | Descarga; no entrenar con fiebre o síntomas en el pecho y consultar a un médico |
| Dolor > 2/10 al correr, que no se va en 60 min o empeora al día siguiente; cambio de pisada; molestia que se repite | Descarga y sugerir revisión profesional; nada de calidad |
| RPE real ≥ objetivo + 2 en 2 o más sesiones, o RPE ≥ 8 en un rodaje suave dos veces | Descarga |
| Cumplimiento < 70 % | Bajar 10–20 % y simplificar; preguntar la causa (tiempo, salud, motivación) |
| Cumplimiento 70–89 % | Mantener la carga (repetir estructura), sin subir |
| Cumplimiento ≥ 90 % y RPE en rango | Progresar según el plan: ~10 % como guía |
| Toca descarga por calendario | Descarga aunque vaya bien |

## Cómo ajustar
- Descarga: −30 a −40 % de km, sin calidad, fuerza ligera.
- Bajar: −10 a −20 %, menos sesiones.
- Mantener: misma carga; se pueden variar estímulos.
- Sin datos: seguir el plan previsto y decirlo.

## Carreras
- Fases de una temporada (Daniels): I base y prevención (E y rectas), II calidad inicial (R), III transición (I y T, la más dura), IV calidad final (T y ritmo de carrera). Si hay poco tiempo, las fases se llenan en este orden: I, IV, III, II.
- Taper de 10K: 7–10 días. Semana de carrera: hasta 70 % del volumen normal sin contar la carrera, mismos días, una sesión corta a ritmo de 10K 3–5 días antes.
- Taper de media: 10–14 días. Semana anterior: hasta 80 % del volumen normal. Semana de carrera: hasta 60 % sin contar la carrera, mismos días, un toque corto a ritmo de carrera. Se mantiene la intensidad; baja el volumen.
- Nunca recortar el taper. Tests y carreras mandan sobre el resto de la semana; los 2 días antes de un test bajan la carga.
- Después de una carrera: 1 día suave por cada 3 km (10K: 3 días; media: 7). Una carrera de preparación a una semana de la meta se corre controlada.
- Predicciones: siempre un rango (índice de forma y Riegel con exponente 1,06–1,08), nunca un solo tiempo. Si la meta pide más de lo que da la forma actual, díselo al coach con números y propone un ritmo de salida prudente.

## Dolor, enfermedad y calor
- Rodilla u otra lesión previa: correr más corto y más seguido, más lento, menos bajadas; subir distancia antes que velocidad o cuestas. Ejercicios de cadera y rodilla en la fuerza.
- Enfermedad: con fiebre (> 38 °C), dolor o presión en el pecho, falta de aire, palpitaciones o mareo en reposo, no se entrena y se consulta a un médico. Se vuelve con 10–20 min suaves al 60–70 % y se avanza solo si a las 24 h no hay síntomas.
- Calor (enero–abril en Lima o días bochornosos): prescribir por esfuerzo o pulso, no por ritmo; un ritmo más lento no es incumplimiento.
- "Que un entrenamiento se sienta fácil no significa que haya que hacerlo más difícil."

## Límites
- No es consejo médico. Ante dolor que persiste, la indicación es parar y consultar a un profesional (fisioterapeuta o médico).
- El plan lo aprueba el coach; la propuesta se marca como asistida por IA.
`.trim();
