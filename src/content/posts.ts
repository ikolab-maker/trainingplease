// Borradores sugeridos para el blog. En el panel (Blog) aparece «Cargar borrador» para cada uno que
// aún no exista; se crea como borrador y el coach lo revisa y publica.
import type { PostContent } from '@/lib/blog';

export interface SuggestedPost {
  slug: string;
  private: boolean;
  es: PostContent;
  en: PostContent;
}

const RPE_ES = `Tu reloj sabe a qué ritmo corriste. No sabe que dormiste cinco horas, que tuviste una semana pesada en el trabajo o que ese ritmo «fácil» hoy se sintió como subir el Morro Solar. Tú sí lo sabes. Y ese dato, el que solo tú tienes, es el que más nos ayuda a armar tu próxima semana.

Se llama **RPE**, y te pedimos dos segundos para registrarlo después de cada sesión.

> Un mismo rodaje de 40 minutos puede ser un 4 un martes cualquiera y un 7 después de una mala noche. El plan de la semana siguiente no debería ser el mismo en los dos casos.

## Qué es el RPE

RPE son las siglas en inglés de *esfuerzo percibido* (Rating of Perceived Exertion). Es un número del 1 al 10 que responde una sola pregunta: **¿qué tan dura fue la sesión, en conjunto?**

No mide solo el corazón ni solo las piernas: suma todo, incluido el cansancio que traías. Por eso funciona tan bien. La escala que usamos es una versión de la **CR-10 de Borg**, la que el fisiólogo Carl Foster propuso para calificar sesiones completas y que hoy se usa en clubes de atletismo, fútbol, natación y ciclismo de todo el mundo.

## La escala, con ejemplos

| RPE | Cómo se siente | Ejemplo |
|---|---|---|
| 1 | Casi nada | Caminar tranquilo, estirar |
| 2 | Muy suave | Trote de calentamiento, hablas sin pensar |
| 3 | Suave | Rodaje fácil: conversas en frases completas |
| 4 | Algo suave | Rodaje cómodo, la respiración ya se nota |
| 5 | Moderado | Ritmo constante: hablas, pero prefieres no hacerlo |
| 6 | Algo duro | Fondo largo al final, ritmo de media maratón |
| 7 | Duro | Ritmo de 10K o tempo: solo frases cortas |
| 8 | Muy duro | Series de 400 a 1000 m: unas pocas palabras |
| 9 | Durísimo | Último repetido o un test a fondo |
| 10 | Máximo | Lo más duro que puedes hacer; un sprint final de carrera |

Un truco útil es la **prueba de la conversación**: si puedes contar qué hiciste el fin de semana sin cortar las frases, estás en 3 o 4. Si solo te salen dos o tres palabras seguidas, ya vas por 7 u 8.

## Cómo marcarlo en la app

1. Termina la sesión y date unos **20 a 30 minutos**. Recién salido, el último esfuerzo pesa demasiado y el número sale inflado.
2. Abre **Mi semana**, toca el día y marca la sesión como hecha.
3. Elige tu **esfuerzo real** del 1 al 10 pensando en *toda* la sesión, no solo en el final.
4. Escribe un comentario corto si algo fue distinto: «dormí mal», «mucho calor», «molestia en la rodilla derecha».

En cada sesión del plan verás también el **RPE previsto**. Si en dos o más sesiones tu RPE real sale 2 puntos o más por encima del previsto, es una señal clara de que conviene bajar la carga, y la próxima semana viene más liviana.

**Si hay dolor, escríbelo siempre.** Un comentario que menciona dolor o enfermedad hace que la próxima semana baje la carga. No es momento de hacerse el fuerte.

## La parte técnica: la carga de la sesión

Con el RPE y la duración se calcula la **carga de la sesión**:

> **carga = RPE × minutos**

| Sesión | Minutos | RPE | Carga |
|---|---|---|---|
| Rodaje suave | 40 | 3 | 120 |
| Series 6 × 800 m | 55 | 8 | 440 |
| Fondo del domingo | 90 | 6 | 540 |

Este método, conocido como *RPE de la sesión*, lo validó Foster en 2001 comparándolo con mediciones de frecuencia cardiaca, y sigue siendo una de las formas más simples y confiables de seguir el entrenamiento sin aparatos.

Sumando las cargas de la semana se ven cosas que los kilómetros solos no muestran:

- **Dos semanas con los mismos kilómetros pueden ser muy distintas.** Si una tuvo series y la otra solo rodajes, la carga lo refleja.
- **Los saltos bruscos se ven a tiempo.** Una semana con mucha más carga que las anteriores es de las señales que más se vigilan para prevenir lesiones.
- **Tu cansancio queda registrado.** Si el mismo entrenamiento te cuesta cada vez más, la carga sube aunque el plan no haya cambiado.

## En resumen

- El RPE es tu número del 1 al 10 para **toda la sesión**.
- Márcalo **20 a 30 minutos después**, con un comentario si algo fue distinto.
- **Carga = RPE × minutos**: la forma más simple de comparar semanas.
- No hay respuestas buenas ni malas. Un 8 honesto vale más que un 5 por quedar bien.

Entrenar con datos no es llenar la app de números: es darle a tu plan la única información que ningún reloj puede medir. Tómate esos dos segundos. Por favor. 😉`;

const RPE_EN = `Your watch knows how fast you ran. It doesn’t know you slept five hours, had a heavy week at work, or that today your “easy” pace felt like running uphill. You do. And that piece of information, the one only you have, is what helps us most when we build your next week.

It’s called **RPE**, and we ask you for two seconds to log it after every session.

> The same 40-minute run can be a 4 on an ordinary Tuesday and a 7 after a bad night. Next week’s plan shouldn’t be the same in both cases.

## What RPE is

RPE stands for **Rating of Perceived Exertion**. It’s a number from 1 to 10 that answers a single question: **how hard was the session, overall?**

It doesn’t measure just your heart or just your legs: it adds everything up, including the tiredness you brought with you. That’s why it works so well. The scale we use is a version of **Borg’s CR-10**, the one physiologist Carl Foster proposed to rate whole sessions, and it’s now used by running, football, swimming and cycling clubs around the world.

## The scale, with examples

| RPE | How it feels | Example |
|---|---|---|
| 1 | Almost nothing | Easy walk, stretching |
| 2 | Very easy | Warm-up jog, you talk without thinking |
| 3 | Easy | Easy run: you talk in full sentences |
| 4 | Fairly easy | Comfortable run, you notice your breathing |
| 5 | Moderate | Steady pace: you can talk, but you’d rather not |
| 6 | Somewhat hard | End of a long run, half-marathon pace |
| 7 | Hard | 10K or tempo pace: only short phrases |
| 8 | Very hard | 400 to 1000 m repeats: just a few words |
| 9 | Extremely hard | Last repeat or an all-out test |
| 10 | Maximal | The hardest you can go; a final race sprint |

A useful trick is the **talk test**: if you can tell someone about your weekend without breaking your sentences, you’re at 3 or 4. If only two or three words come out at a time, you’re at 7 or 8.

## How to log it in the app

1. Finish the session and wait **20 to 30 minutes**. Right after, the last effort weighs too much and the number comes out inflated.
2. Open **My week**, tap the day and mark the session as done.
3. Choose your **actual effort** from 1 to 10, thinking about the *whole* session, not just the end.
4. Write a short comment if something was different: “slept badly”, “very hot”, “right knee discomfort”.

Each session in your plan also shows the **planned RPE**. If in two or more sessions your actual RPE comes out 2 or more points above the planned one, that’s a clear sign the load should come down, and next week comes lighter.

**If something hurts, always write it down.** A comment that mentions pain or illness makes next week’s load come down. This is not the time to tough it out.

## The technical part: session load

With RPE and duration you get the **session load**:

> **load = RPE × minutes**

| Session | Minutes | RPE | Load |
|---|---|---|---|
| Easy run | 40 | 3 | 120 |
| 6 × 800 m repeats | 55 | 8 | 440 |
| Sunday long run | 90 | 6 | 540 |

This method, known as *session RPE*, was validated by Foster in 2001 against heart-rate measurements, and it’s still one of the simplest and most reliable ways to track training without gadgets.

Adding up the week’s loads shows things kilometres alone don’t:

- **Two weeks with the same kilometres can be very different.** If one had repeats and the other only easy runs, the load shows it.
- **Sudden jumps show up in time.** A week with much more load than the previous ones is one of the signals most watched to prevent injuries.
- **Your fatigue gets recorded.** If the same workout keeps costing you more, the load goes up even though the plan hasn’t changed.

## In short

- RPE is your number from 1 to 10 for **the whole session**.
- Log it **20 to 30 minutes later**, with a comment if something was different.
- **Load = RPE × minutes**: the simplest way to compare weeks.
- There are no right or wrong answers. An honest 8 is worth more than a 5 to look good.

Training with data isn’t about filling the app with numbers: it’s about giving your plan the one piece of information no watch can measure. Take those two seconds. Please. 😉`;

export const SUGGESTED_POSTS: SuggestedPost[] = [
  {
    slug: 'que-es-el-rpe',
    private: false,
    es: {
      title: 'RPE: el dato que tu reloj no puede medir',
      summary: 'Qué es el esfuerzo percibido, cómo marcarlo bien en la app y cómo se usa para medir la carga de cada sesión.',
      body: RPE_ES,
    },
    en: {
      title: 'RPE: the number your watch can’t measure',
      summary: 'What perceived exertion is, how to log it well in the app, and how it’s used to measure the load of every session.',
      body: RPE_EN,
    },
  },
];
