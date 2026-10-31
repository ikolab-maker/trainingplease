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

const TEST_ES = `Tu plan dice «suave», «a ritmo» o «series». Para que esas palabras signifiquen algo para ti, y no para un atleta promedio, necesitamos saber dónde estás hoy. La forma más simple y honesta de saberlo es correr.

Por eso, **cada 6 semanas corres un 5K a tope**. No es una carrera ni una prueba de valor. Es una foto de tu forma. Con esa foto se ajustan los ritmos de las semanas siguientes.

> No entrenas para el test. El test te dice cómo entrenar.

## Por qué cada 6 semanas

El cuerpo tarda semanas en asimilar el entrenamiento. Si mides muy seguido, ves ruido: un mal día, una mala noche. Si mides muy de vez en cuando, entrenas semanas con ritmos que ya no son los tuyos.

Seis semanas es nuestro punto medio. Da tiempo a que el entrenamiento se note y mantiene tus ritmos al día. El test va al final de una semana más liviana, para que llegues fresco. Si corriste una carrera a tope hace poco, esa carrera ya es tu foto y el test se corre más adelante.

## Por qué un 5K

- **Es corto pero exigente:** entre 20 y 35 minutos para casi todos. Dice mucho de tu forma sin dejarte destruido una semana.
- **En pista es exacto:** 12 vueltas y media de 400 m. Sin errores de GPS ni cuestas.
- **Se puede repetir igual:** misma pista, misma hora, mismo calentamiento. Así comparas tu test de hoy con el de dentro de 6 semanas.

[[test-5k]]

## El día antes

**Descanso, o como mucho 20 minutos muy suaves.** Nada de fuerza de piernas, cuestas ni caminatas largas. Si tu plan dice otra cosa para ese día, manda el test.

**Duerme lo que puedas.** Si los nervios no te dejan dormir, tranquilo: pesa más lo que dormiste las noches anteriores.

**Toma agua durante el día**, sin exagerar, hasta que la orina salga clarita. Y **nada de alcohol**.

## Qué comer

**La cena:**
- Normal, con una buena porción de arroz, fideos, papa o pan.
- Nada nuevo, frito ni muy picante, y poca menestra.
- Cena temprano, unas 10 horas antes del test.

**El desayuno, 1 a 2 horas antes:**
- Liviano y conocido: pan con mermelada o miel, o un plátano.
- Café si lo tomas siempre.
- Uno o dos vasos de agua al despertar.

**La regla de oro:** el día del test no se prueba nada nuevo. Ni comida, ni gel, ni zapatillas.

## Qué llevar

- Ropa liviana y una capa para calentar.
- Tus zapatillas de siempre.
- Agua, toalla y un polo de cambio.

## Tu reloj

- **Si tu Garmin tiene un perfil de pista** («Carrera en pista»), úsalo: cuenta bien las vueltas de 400 m.
- **Si no lo tiene, apaga la vuelta automática de 1 km** (Auto Lap). En la pista el GPS se equivoca y te marcaría kilómetros falsos. Si te sientes cómodo, marca vuelta cada vez que pases por la meta. Si no, no toques nada: tu coach toma el tiempo oficial y los parciales.
- **Llévalo cargado y con el pulso activo.** Tu frecuencia cardíaca también nos sirve.

## Cómo se corre

1. **Calentamiento de 20 minutos:**
   - 10 a 12 minutos de trote muy suave.
   - 5 minutos de movilidad.
   - 3 o 4 rectas progresivas.
2. **Las dos primeras vueltas, más lento de lo que te pide el cuerpo.** Es el error más común: salir rápido y pagarlo en el kilómetro 3. Tu coach te dirá a qué tiempo por vuelta ir.
3. **Del kilómetro 2 al 4, parejo.** Busca el ritmo que sientes que puedes sostener hasta el final.
4. **El último kilómetro, lo que quede.**
5. **Si aparece un dolor que te cambia la pisada, mareo o dolor en el pecho, paras.** Un test se repite; una lesión no se borra.

Al terminar, trota o camina 10 minutos, toma agua y come algo.

## Después: tu registro

Ese mismo día, en la app, marca la sesión como hecha. Si fue a tope, tu RPE es **9 o 10**. Escribe en el comentario cómo te fue: cómo dormiste, si saliste rápido, si te dolió algo. Ese comentario decide si tu tiempo se usa tal cual.

## Cómo se arma tu tabla de ritmos

Tu tiempo se convierte en un **número de forma**, con fórmulas de fisiología del ejercicio publicadas hace décadas y usadas por entrenadores en todo el mundo. De ese número salen cinco ritmos, cada uno con su trabajo:

[[ritmos]]

Tres cosas que conviene saber:
- **Tu tabla se fija con tu forma de hoy, no con tu meta.** Entrenar al ritmo de la meta antes de tiempo es la vía rápida a lesionarse.
- **Tus ritmos se quedan al menos unas semanas.** Si un entrenamiento se siente fácil, cumplió su objetivo: no hay que hacerlo más difícil.
- **Un test malo no te baja los ritmos solo.** Si hizo calor, dormiste mal o venías cansado, tu coach lo lee en tu comentario y decide.

## Cuándo no toca un test

- **En las semanas antes de tu carrera.** Ahí manda la reducción de carga (el *tapering*): menos kilómetros, la misma intensidad en tramos cortos, para llegar fresco. Dura 1 a 2 semanas según la distancia.
- **En los días suaves después de una carrera.** La regla práctica es 1 día suave por cada 3 km corridos: unos 2 días después de un 5K, 3 después de un 10K y una semana después de una media maratón.
- **Con dolor o enfermedad.** Fiebre, dolor en el pecho, mareos o un dolor que te cambia la pisada. Primero sanar.
- **Si corriste una carrera a tope hace poco.** Esa carrera ya es tu foto.

En pocas palabras: un test cada 6 semanas, bien preparado y bien registrado, hace que tu plan hable de ti y no de un corredor cualquiera.`;

const TEST_EN = `Your plan says “easy”, “at pace” or “repeats”. For those words to mean something for you, and not for an average runner, we need to know where you are today. The simplest and most honest way to find out is to run.

That’s why **every 6 weeks you run an all-out 5K**. It’s not a race or a test of courage. It’s a snapshot of your fitness. That snapshot sets your paces for the weeks that follow.

> You don’t train for the test. The test tells you how to train.

## Why every 6 weeks

Your body takes weeks to absorb training. Measure too often and you see noise: a bad day, a bad night. Measure too rarely and you train for weeks at paces that are no longer yours.

Six weeks is our middle ground. It gives training time to show and keeps your paces up to date. The test comes at the end of a lighter week, so you arrive fresh. If you recently ran an all-out race, that race is already your snapshot and the test moves later.

## Why a 5K

- **Short but demanding:** between 20 and 35 minutes for almost everyone. It says a lot about your fitness without wrecking you for a week.
- **Exact on a track:** twelve and a half 400 m laps. No GPS errors, no hills.
- **Repeatable:** same track, same time, same warm-up. So you can compare today’s test with the one six weeks from now.

[[test-5k]]

## The day before

**Rest, or at most 20 very easy minutes.** No leg strength work, hills or long walks. If your plan says something else for that day, the test comes first.

**Sleep as much as you can.** If nerves keep you awake, don’t worry: the nights before matter more.

**Drink water through the day**, without overdoing it, until your urine is pale. And **no alcohol**.

## What to eat

**Dinner:**
- A normal meal with a good portion of rice, pasta, potatoes or bread.
- Nothing new, fried or very spicy, and go light on beans.
- Eat early, about 10 hours before the test.

**Breakfast, 1 to 2 hours before:**
- Light and familiar: bread with jam or honey, or a banana.
- Coffee if you always have it.
- One or two glasses of water when you wake up.

**The golden rule:** on test day you don’t try anything new. Not food, not gels, not shoes.

## What to bring

- Light clothes and a layer to warm up in.
- Your usual shoes.
- Water, a towel and a spare shirt.

## Your watch

- **If your Garmin has a track profile** (“Track Run”), use it: it counts 400 m laps properly.
- **If it doesn’t, turn off the automatic 1 km lap** (Auto Lap). On a track the GPS gets it wrong and would mark false kilometres. If you feel comfortable, press lap every time you cross the finish line. If not, don’t touch anything: your coach takes the official time and splits.
- **Charge it and turn on heart rate.** Your heart rate helps us too.

## How to run it

1. **A 20-minute warm-up:**
   - 10 to 12 minutes of very easy jogging.
   - 5 minutes of mobility.
   - 3 or 4 progressive strides.
2. **The first two laps, slower than your body asks for.** It’s the most common mistake: starting fast and paying for it at kilometre 3. Your coach will tell you what time per lap to aim for.
3. **From kilometre 2 to 4, even.** Find the pace you feel you can hold to the end.
4. **The last kilometre, whatever is left.**
5. **If pain changes your stride, or you feel dizzy or have chest pain, stop.** A test can be repeated; an injury can’t be undone.

When you finish, jog or walk for 10 minutes, drink water and eat something.

## After: your log

That same day, in the app, mark the session as done. If it was all-out, your RPE is **9 or 10**. In the comment, tell us how it went: how you slept, whether you started fast, whether anything hurt. That comment decides whether your time is used as is.

## How your pace table is built

Your time becomes a **fitness number**, using exercise physiology formulas published decades ago and used by coaches around the world. Five paces come out of that number, each with its own job:

[[ritmos]]

Three things worth knowing:
- **Your table is set by your fitness today, not by your goal.** Training at goal pace too early is the fast lane to injury.
- **Your paces stay for at least a few weeks.** If a workout feels easy, it did its job: there’s no need to make it harder.
- **A bad test doesn’t lower your paces on its own.** If it was hot, you slept badly or you were tired, your coach reads it in your comment and decides.

## When it’s not time for a test

- **In the weeks before your race.** That’s when the load reduction (the *taper*) rules: fewer kilometres, the same intensity in short bouts, so you arrive fresh. It lasts 1 to 2 weeks depending on the distance.
- **In the easy days after a race.** The practical rule is 1 easy day for every 3 km raced: about 2 days after a 5K, 3 after a 10K and a week after a half marathon.
- **With pain or illness.** Fever, chest pain, dizziness or pain that changes your stride. Heal first.
- **If you recently ran an all-out race.** That race is already your snapshot.

In short: a test every 6 weeks, well prepared and well logged, makes your plan talk about you and not about just any runner.`;

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
  },  {
    slug: 'test-5k-cada-6-semanas',
    private: false,
    es: {
      title: 'Tu test de 5K: cómo prepararlo, correrlo y qué hacemos con tu tiempo',
      summary: 'Cada 6 semanas corres un 5K a tope. De ese tiempo salen los ritmos de tu plan. Qué hacer el día antes, qué comer, cómo correrlo y cuándo no toca.',
      body: TEST_ES,
    },
    en: {
      title: 'Your 5K test: how to prepare, run it and what we do with your time',
      summary: 'Every 6 weeks you run an all-out 5K. Your plan’s paces come from that time. What to do the day before, what to eat, how to run it and when not to.',
      body: TEST_EN,
    },
  },
];
