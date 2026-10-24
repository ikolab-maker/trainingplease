// Borradores sugeridos para el blog. En el panel (Blog) aparece «Cargar borrador» para cada uno que
// aún no exista; se crea como borrador y el coach lo revisa y publica.
import type { PostContent } from '@/lib/blog';

export interface SuggestedPost {
  slug: string;
  private: boolean;
  es: PostContent;
  en: PostContent;
}

const RPE_ES = `Tu reloj sabe a qué ritmo corriste. No sabe que dormiste cinco horas, que tuviste una semana pesada en el trabajo o que ese ritmo «fácil» hoy se sintió como subir el Morro Solar. Tú sí lo sabes.

Por eso, después de cada entreno te pedimos dos cosas: **un número y unas líneas**. El número es tu **RPE**. Las líneas son tu **comentario**. Juntos son lo que más pesa cuando se arma tu próxima semana.

> El número dice cuánto te costó. El comentario dice por qué.

## Por qué importa lo que registras

Cada domingo tu semana siguiente se prepara a partir de lo que registraste. Tu coach y los agentes que preparan tu plan leen cada sesión, con su RPE y su comentario. Esto es lo que pasa con lo que escribes:

- **Si en dos o más sesiones tu RPE sale 2 puntos o más por encima del previsto**, la semana siguiente viene más liviana.
- **Si un rodaje suave te salió en 8 o más dos veces**, también se baja la carga: algo no anda bien.
- **Si tu comentario menciona dolor o enfermedad**, la semana siguiente baja la carga y quita el trabajo de calidad.
- **Si cumpliste y los números salen como estaba previsto**, hay espacio para progresar.
- **Si no registras nada**, el plan sigue igual, sin adaptarse a ti. Es una semana armada a ciegas.

En pocas palabras: dos segundos de registro hoy deciden si la próxima semana te cuida, te sostiene o te empuja.

## El número: tu RPE

RPE son las siglas en inglés de *esfuerzo percibido*. Es un número del 1 al 10 que responde una sola pregunta: **¿qué tan dura fue la sesión, en conjunto?** Suma todo, incluido el cansancio que traías. Usamos una versión de la **escala CR-10 de Borg**, la que el fisiólogo Carl Foster propuso para calificar sesiones completas.

[[escala-rpe]]

Un truco útil es la **prueba de la conversación**: si puedes contar qué hiciste el fin de semana sin cortar las frases, estás en 3 o 4. Si solo te salen dos o tres palabras seguidas, ya vas por 7 u 8.

## Las palabras: tu comentario

Un mismo 7 puede significar cosas muy distintas. «7 porque hice las series al ritmo previsto» es una buena noticia. «7 en un rodaje suave porque dormí cuatro horas» pide otra semana. Sin el comentario, los dos se ven iguales.

Qué contar, en una o dos líneas:

- **Cómo llegaste:** sueño, estrés, trabajo, viaje.
- **Cómo respondió el cuerpo:** piernas pesadas o sueltas, respiración, ritmo cómodo o justo.
- **Dolor o molestia:** dónde, cuánto del 0 al 10 y si empeoró al moverte.
- **Condiciones:** calor, cuestas, superficie, hora.
- **Cambios:** qué hiciste distinto del plan y por qué.

Compara estos dos comentarios:

> «Bien.»

> «Piernas pesadas los primeros 15 minutos, después bien. Dormí 6 horas. Molestia leve en el talón izquierdo al final, 2 de 10; se fue al estirar.»

Con el primero nadie puede ayudarte. Con el segundo, tu próxima semana sabe que hay que vigilar ese talón y cuidar el sueño.

**Si hay dolor, escríbelo siempre.** No es momento de hacerse el fuerte: es justo lo que más necesita saber tu plan.

## Cómo registrarlo en la app

1. Termina la sesión y date unos **20 a 30 minutos**. Recién salido, el último esfuerzo pesa demasiado y el número sale inflado.
2. Abre **Mi semana**, toca el día y marca la sesión como hecha.
3. Elige tu **esfuerzo real** del 1 al 10 pensando en *toda* la sesión, no solo en el final.
4. Escribe tu **comentario**, aunque sea una línea.

En cada sesión del plan verás también el **RPE previsto**, para comparar lo que se esperaba con lo que sentiste.

## La parte técnica: la carga de la sesión

Con el RPE y la duración se calcula la **carga de la sesión**:

> **carga = RPE × minutos**

[[carga]]

Este método, conocido como *RPE de la sesión*, lo validó Foster en 2001 comparándolo con mediciones de frecuencia cardiaca, y sigue siendo una de las formas más simples y confiables de seguir el entrenamiento sin aparatos. Sumando las cargas de la semana se ven cosas que los kilómetros solos no muestran:

- **Dos semanas con los mismos kilómetros pueden ser muy distintas.** Si una tuvo series y la otra solo rodajes, la carga lo refleja.
- **Los saltos bruscos se ven a tiempo.** Una semana con mucha más carga que las anteriores es de las señales que más se vigilan para prevenir lesiones.
- **Tu cansancio queda registrado.** Si el mismo entrenamiento te cuesta cada vez más, la carga sube aunque el plan no haya cambiado.

## En resumen

- Después de cada entreno: **un número y unas líneas**.
- El RPE va del 1 al 10 y califica **toda la sesión**. Márcalo **20 a 30 minutos después**.
- En el comentario cuenta **sueño, sensaciones, dolor y contexto**.
- Sin registro, tu plan **no puede adaptarse a ti**.
- No hay respuestas buenas ni malas. Un 8 honesto vale más que un 5 por quedar bien.

Entrenar con datos no es llenar la app de números: es darle a tu plan la única información que ningún reloj puede medir. Tómate esos dos segundos. Por favor.`;

const RPE_EN = `Your watch knows how fast you ran. It doesn’t know you slept five hours, had a heavy week at work, or that today your “easy” pace felt like running uphill. You do.

That’s why, after every workout, we ask you for two things: **a number and a few lines**. The number is your **RPE**. The lines are your **comment**. Together they carry the most weight when your next week is built.

> The number says how hard it was. The comment says why.

## Why what you log matters

Every Sunday your next week is prepared from what you logged. Your coach and the agents that prepare your plan read every session, with its RPE and its comment. This is what happens with what you write:

- **If in two or more sessions your RPE comes out 2 or more points above the planned one**, next week comes lighter.
- **If an easy run came out at 8 or more twice**, the load also comes down: something isn’t right.
- **If your comment mentions pain or illness**, next week lowers the load and drops the quality work.
- **If you completed the week and the numbers match the plan**, there’s room to progress.
- **If you log nothing**, the plan stays the same, without adapting to you. It’s a week built blind.

In short: two seconds of logging today decide whether next week looks after you, holds you steady or pushes you.

## The number: your RPE

RPE stands for **Rating of Perceived Exertion**. It’s a number from 1 to 10 that answers a single question: **how hard was the session, overall?** It adds everything up, including the tiredness you brought with you. We use a version of **Borg’s CR-10 scale**, the one physiologist Carl Foster proposed to rate whole sessions.

[[escala-rpe]]

A useful trick is the **talk test**: if you can tell someone about your weekend without breaking your sentences, you’re at 3 or 4. If only two or three words come out at a time, you’re at 7 or 8.

## The words: your comment

The same 7 can mean very different things. “7 because I ran the repeats at the planned pace” is good news. “7 on an easy run because I slept four hours” calls for a different week. Without the comment, both look the same.

What to say, in one or two lines:

- **How you arrived:** sleep, stress, work, travel.
- **How your body responded:** heavy or loose legs, breathing, pace comfortable or tight.
- **Pain or discomfort:** where, how much from 0 to 10, and whether it got worse as you moved.
- **Conditions:** heat, hills, surface, time of day.
- **Changes:** what you did differently from the plan and why.

Compare these two comments:

> “Good.”

> “Heavy legs for the first 15 minutes, then fine. Slept 6 hours. Slight discomfort in my left heel at the end, 2 out of 10; it went away after stretching.”

With the first, nobody can help you. With the second, your next week knows to keep an eye on that heel and look after your sleep.

**If something hurts, always write it down.** This is not the time to tough it out: it’s exactly what your plan most needs to know.

## How to log it in the app

1. Finish the session and wait **20 to 30 minutes**. Right after, the last effort weighs too much and the number comes out inflated.
2. Open **My week**, tap the day and mark the session as done.
3. Choose your **actual effort** from 1 to 10, thinking about the *whole* session, not just the end.
4. Write your **comment**, even if it’s one line.

Each session in your plan also shows the **planned RPE**, so you can compare what was expected with what you felt.

## The technical part: session load

With RPE and duration you get the **session load**:

> **load = RPE × minutes**

[[carga]]

This method, known as *session RPE*, was validated by Foster in 2001 against heart-rate measurements, and it’s still one of the simplest and most reliable ways to track training without gadgets. Adding up the week’s loads shows things kilometres alone don’t:

- **Two weeks with the same kilometres can be very different.** If one had repeats and the other only easy runs, the load shows it.
- **Sudden jumps show up in time.** A week with much more load than the previous ones is one of the signals most watched to prevent injuries.
- **Your fatigue gets recorded.** If the same workout keeps costing you more, the load goes up even though the plan hasn’t changed.

## In short

- After every workout: **a number and a few lines**.
- RPE goes from 1 to 10 and rates **the whole session**. Log it **20 to 30 minutes later**.
- In the comment, tell us about **sleep, sensations, pain and context**.
- Without logging, your plan **can’t adapt to you**.
- There are no right or wrong answers. An honest 8 is worth more than a 5 to look good.

Training with data isn’t about filling the app with numbers: it’s about giving your plan the one piece of information no watch can measure. Take those two seconds. Please.`;

export const SUGGESTED_POSTS: SuggestedPost[] = [
  {
    slug: 'que-es-el-rpe',
    private: false,
    es: {
      title: 'Un número y unas líneas: por qué registrar tu RPE y cómo te sentiste',
      summary: 'Lo que escribes después de cada entreno decide tu próxima semana. Qué es el RPE, qué contar en el comentario y cómo se mide la carga.',
      body: RPE_ES,
    },
    en: {
      title: 'A number and a few lines: why log your RPE and how you felt',
      summary: 'What you write after every workout decides your next week. What RPE is, what to say in the comment and how load is measured.',
      body: RPE_EN,
    },
  },
];
