/* ==========================================================
   Plan de Claudia · media maratón
   Todo el contenido está en la sección DATOS.
   Para agregar una semana nueva: copiar un objeto de WEEKS,
   cambiar id, fechas y sesiones.
   ========================================================== */
(function () {
  'use strict';

  /* ---------------- DATOS ---------------- */

  // Fecha provisional de la carrera (hora de Lima, UTC-5)
  var RACE = new Date('2027-08-22T06:00:00-05:00');

  var TYPES = {
    gym:  { label: 'Gimnasio',  color: 'var(--blue)',      ink: 'var(--ink)' },
    run:  { label: 'Carrera',   color: 'var(--pink)',      ink: '#fff' },
    tech: { label: 'Técnica',   color: 'var(--yellow)',    ink: 'var(--ink)' },
    mob:  { label: 'Movilidad', color: 'var(--mint)',      ink: 'var(--ink)' },
    rest: { label: 'Descanso',  color: 'var(--lilac)',     ink: 'var(--ink)' },
    long: { label: 'Fondo',     color: 'var(--pink-dark)', ink: '#fff' }
  };

  var WEEKS = [
    {
      id: 'sem-01',
      title: 'Semana 1',
      range: '21 al 27 de septiembre',
      start: '2026-09-21',
      phase: 'Amanecer · Cada madrugada cuenta',
      goal: 'Cumplir las 5 sesiones principales sin buscar ritmo. Paso de 1 a 3 carreras por semana (unos 13 km en total) y ninguna pasa de los 6 km. El ritmo es suave: entre 7:30 y 8:00 por km, con el que puedo conversar.',
      days: [
        {
          key: 'lun', dow: 'Lun', num: 21, date: '2026-09-21', type: 'gym', core: true,
          title: 'Gym A · Fuerza base', meta: '45 min',
          steps: [
            'Calentamiento de 8 min (caminata rápida o bici suave y movilidad)',
            'Sentadilla goblet: 3 × 10',
            'Peso muerto rumano con mancuernas: 3 × 10',
            'Zancada reversa: 3 × 8 por pierna',
            'Puente de glúteo con carga: 3 × 12',
            'Elevación de talones: 3 × 12',
            'Plancha 3 × 30 s y dead bug 3 × 8 por lado'
          ],
          tip: 'Esfuerzo de 6 a 7 sobre 10. Al terminar cada serie, siento que podía hacer 2 repeticiones más.'
        },
        {
          key: 'mar', dow: 'Mar', num: 22, date: '2026-09-22', type: 'run', core: true,
          title: 'Carrera suave', meta: '25 a 30 min · unos 3,5 km',
          steps: [
            'Trote continuo y conversable (esfuerzo de 3 a 4 sobre 10)',
            'Ritmo guía: 7:30 a 8:00 por km. Manda la sensación, no el reloj',
            'Si el cuerpo pide pausa: 5 min trotando y 1 min caminando, y repito'
          ],
          tip: 'Terminar con ganas de más es el objetivo de esta semana.'
        },
        {
          key: 'mie', dow: 'Mié', num: 23, date: '2026-09-23', type: 'mob', extra: true,
          title: 'Movilidad y descarga', meta: '20 min',
          steps: [
            'Foam roller en cuádriceps, isquios, glúteo y gemelos (1 a 2 min por zona)',
            'Estiramiento de flexores de cadera y posición 90/90',
            'Gemelo en la pared',
            '2 min de respiración tranquila',
            '<span class="pin">Pendiente de la semana:</span> agendar el chequeo médico (hemograma y ferritina)'
          ],
          tip: 'Estirar es sentir una tensión suave, nunca dolor.'
        },
        {
          key: 'jue', dow: 'Jue', num: 24, date: '2026-09-24', type: 'tech', core: true,
          title: 'Técnica de carrera', meta: '30 min · unos 4 km',
          focus: 'Lo que voy a cuidar: inclinación leve desde los tobillos, pisada bajo el cuerpo, brazos a 90°, hombros sueltos y una cadencia de 165 a 175 pasos por minuto (la veo en el Apple Watch).',
          steps: [
            '10 min de trote suave',
            'Ejercicios de técnica, 2 × 15 m cada uno: marcha alta, skipping bajo, talones al glúteo y tobillos',
            '15 min de trote suave',
            'Cierre: 4 aceleraciones de 15 a 20 s (unos 5:30 por km), caminando 60 a 90 s entre cada una'
          ],
          tip: 'Las aceleraciones son ágiles, no un sprint. Termino cada una con el cuerpo relajado.'
        },
        {
          key: 'vie', dow: 'Vie', num: 25, date: '2026-09-25', type: 'gym', core: true,
          title: 'Gym B · Torso y core', meta: '40 min',
          steps: [
            'Remo con mancuerna: 3 × 10',
            'Press de hombro: 3 × 10',
            'Jalón al pecho: 3 × 10',
            'Abducción de cadera con banda: 3 × 12',
            'Pallof press: 3 × 10',
            'Bird-dog: 3 × 8',
            'Plancha lateral: 3 × 20 s'
          ],
          tip: 'Hoy no trabajo piernas pesadas: mañana descanso y el domingo toca el fondo.'
        },
        {
          key: 'sab', dow: 'Sáb', num: 26, date: '2026-09-26', type: 'rest',
          title: 'Descanso', meta: 'Recuperar también es entrenar',
          steps: [
            'Caminata opcional de 30 a 40 min',
            '10 min de foam roller por la noche',
            'Dormir entre 7,5 y 8 horas'
          ],
          tip: 'Hoy mi cuerpo absorbe todo lo que trabajé esta semana.'
        },
        {
          key: 'dom', dow: 'Dom', num: 27, date: '2026-09-27', type: 'long', core: true,
          title: 'Fondo suave', meta: '45 a 50 min · unos 6 km',
          steps: [
            'Trote suave, los primeros 5 min todavía más tranquilos',
            'Después mantengo el mismo ritmo hasta el final',
            'Objetivo: que todos los parciales queden dentro de 10 segundos entre sí'
          ],
          tip: 'Al terminar: yogur griego con fruta, o huevos con pan. Y hoy sí, un postre 🍰'
        }
      ],
      rules: [
        {
          title: 'Antes y después de entrenar',
          html: '<ul><li>Antes de correr: algo ligero (una banana o una tostada con miel) y agua.</li><li>Después: proteína y carbohidrato en la primera hora. Por ejemplo, yogur griego con fruta o huevos con pan.</li></ul>'
        },
        {
          title: 'El dulce tiene su día',
          html: '<p>Un postre el domingo, después del fondo. El resto de la semana, sin dulce suelto.</p><p>No se prohíbe: se programa.</p>'
        },
        {
          title: 'Cómo sé que voy bien',
          html: '<div class="effort"><div><b>3 a 4</b><span>Suave: puedo conversar</span></div><div><b>6 a 7</b><span>Fuerte: me quedan 2 repeticiones en reserva</span></div></div><p style="margin-top:.7rem">Cada día anoto el esfuerzo (1 a 10), las horas de sueño y cualquier molestia. Si un dolor pasa de 3 sobre 10 o me cambia la pisada, corto la sesión.</p>'
        }
      ]
    }
  ];

  var PHASES = [
    {
      id: 'amanecer', name: 'Amanecer', motto: 'Cada madrugada cuenta', color: 'var(--yellow)',
      start: '2026-09-21', end: '2026-11-15', weeks: 8,
      what: 'Construyo el hábito y una base sólida. Corro suave, aprendo técnica y me acostumbro a entrenar de 3 a 4 días por semana.',
      gym: 'Adaptación y técnica de cada ejercicio.',
      test: 'Test de 5K el domingo 15 de noviembre. Meta: 28:45 o menos. Justo después de mi cumpleaños.'
    },
    {
      id: 'raices', name: 'Raíces', motto: 'Lo que crece en silencio', color: 'var(--mint)',
      start: '2026-11-16', end: '2027-01-24', weeks: 10,
      what: 'Sumo kilómetros con paciencia. Los fondos crecen hasta los 10 o 12 km y la fuerza sube de nivel.',
      gym: 'Fuerza más pesada, con series de 6 a 8 repeticiones.',
      test: 'Primer 10K el domingo 13 de diciembre. Meta: 1:01:00 o menos. En las fiestas, semanas flexibles.'
    },
    {
      id: 'forja', name: 'Forja', motto: 'La velocidad se forja', color: 'var(--blue)',
      start: '2027-01-25', end: '2027-03-21', weeks: 8,
      what: 'Aquí gano velocidad. Aparecen los intervalos cortos y el trabajo a ritmo firme, sin perder la técnica.',
      gym: 'Potencia suave, para correr con más impulso.',
      test: 'Test de 5K el 21 de febrero (27:00 o menos) y segundo 10K el 21 de marzo (57:30 o menos).'
    },
    {
      id: 'fuego', name: 'Fuego', motto: 'Resistencia que no se apaga', color: 'var(--pink-soft)',
      start: '2027-03-22', end: '2027-05-30', weeks: 10,
      what: 'Trabajo la resistencia. Los fondos suben de 14 a 18 km y aprendo a correr largo sin apagarme.',
      gym: 'Mantenimiento: lo justo para seguir fuerte.',
      test: 'Fondo de 18 km el 25 de abril y primer 21K de prueba el 30 de mayo, entre 2:05 y 2:08. Ahí practico el ritmo, no busco récord.'
    },
    {
      id: 'cumbre', name: 'Cumbre', motto: 'Ritmo de sub-2', color: 'var(--lilac)',
      start: '2027-05-31', end: '2027-07-25', weeks: 8,
      what: 'El tramo más específico. Practico el ritmo de 5:41 por km y llego al mayor volumen del plan, entre 34 y 38 km por semana.',
      gym: 'Una sola sesión, más liviana y con foco en el core.',
      test: '10K de prueba de fuego el 27 de junio (54:30 o menos) y ensayo general el 18 de julio: 18 a 20 km con 10 a 12 km a 5:41 por km.'
    },
    {
      id: 'vuelo', name: 'Vuelo', motto: 'Llegar fresca, correr libre', color: '#FFC38A',
      start: '2027-07-26', end: '2027-08-22', weeks: 4,
      what: 'Bajo la carga, descanso y confío en lo que entrené. Llego fresca a la línea de salida.',
      gym: 'Solo activación, sin cansarme.',
      test: 'Domingo 22 de agosto: Media Maratón de Lima.'
    }
  ];

  var MONTHS = [
    { y: 2026, m: 8,  name: 'Septiembre', ph: ['amanecer'],           focus: 'Empiezo de nuevo: técnica y 3 carreras por semana.', km: '13 a 14', hito: 'Agendar el chequeo médico (hemograma y ferritina).' },
    { y: 2026, m: 9,  name: 'Octubre',    ph: ['amanecer'],           focus: 'Base aeróbica. El fondo llega a 9 o 10 km y el gym es de adaptación.', km: '14 a 19', hito: 'Semana de descarga del 12 al 18 de octubre.' },
    { y: 2026, m: 10, name: 'Noviembre',  ph: ['amanecer', 'raices'], focus: 'Últimas semanas de base y luego más volumen.', km: '18 a 22', hito: 'Test de 5K el domingo 15. Meta: 28:45 o menos. Mi regalo de cumpleaños.' },
    { y: 2026, m: 11, name: 'Diciembre',  ph: ['raices'],             focus: 'Fondos de 10 a 12 km y fuerza más pesada.', km: '22 a 26', hito: 'Primer 10K el domingo 13. Meta: 1:01:00 o menos. Semanas flexibles en fiestas.' },
    { y: 2027, m: 0,  name: 'Enero',      ph: ['raices', 'forja'],    focus: 'Fondo de 12 a 14 km. Empiezan los intervalos.', km: '24 a 28', hito: 'Cierre de Raíces el 24 de enero.' },
    { y: 2027, m: 1,  name: 'Febrero',    ph: ['forja'],              focus: 'Intervalos cortos, ritmo firme y técnica.', km: '26 a 30', hito: 'Test de 5K el domingo 21. Meta: 27:00 o menos.' },
    { y: 2027, m: 2,  name: 'Marzo',      ph: ['forja', 'fuego'],     focus: 'Ritmo firme y los primeros fondos largos.', km: '28 a 30', hito: 'Segundo 10K el domingo 21. Meta: 57:30 o menos. Semana Santa (22 al 28) de descarga.' },
    { y: 2027, m: 3,  name: 'Abril',      ph: ['fuego'],              focus: 'Fondos que crecen poco a poco, de 14 a 18 km.', km: '30 a 34', hito: 'Fondo de 18 km el domingo 25.' },
    { y: 2027, m: 4,  name: 'Mayo',       ph: ['fuego', 'cumbre'],    focus: 'Fondos con bloques a ritmo de carrera.', km: '32 a 36', hito: 'Primer 21K de prueba el domingo 30. Entre 2:05 y 2:08.' },
    { y: 2027, m: 5,  name: 'Junio',      ph: ['cumbre'],             focus: 'Trabajo a 5:41 por km y pico de volumen.', km: '34 a 38', hito: '10K de prueba de fuego el domingo 27. Meta: 54:30 o menos.' },
    { y: 2027, m: 6,  name: 'Julio',      ph: ['cumbre', 'vuelo'],    focus: 'Ensayo general y luego bajo la carga.', km: '38, bajando a 20', hito: 'Ensayo el domingo 18: 18 a 20 km con 10 a 12 a 5:41 por km.' },
    { y: 2027, m: 7,  name: 'Agosto',     ph: ['vuelo'],              focus: 'Semana de carrera: descanso y confianza.', km: 'Unos 10, más el 21K', hito: 'Media Maratón de Lima, domingo 22.' }
  ];

  var STRENGTHS = [
    { icon: '💖', title: 'Mi meta es mía', text: 'La media maratón de Lima me contagió las ganas y la decisión es mía. Las metas que uno elige son las que más duran.' },
    { icon: '🌱', title: '33 años, casi 34', text: 'Estoy en una gran etapa para mejorar la resistencia. El 14 de noviembre cumplo 34 y el 15 hago mi primer test.' },
    { icon: '🌅', title: 'Duermo y despierto temprano', text: 'Entreno fresca, recupero mejor y ya estoy acostumbrada a rendir de mañana, que es cuando se corren las carreras.' },
    { icon: '🏋️', title: 'El gym ya es un hábito', text: 'Llevo 47 sesiones en 2026. Esa fuerza me protege y me hace correr mejor.' },
    { icon: '🏁', title: 'Ya crucé una meta de 10K', text: 'En junio corrí 9,96 km en 1:05:15. Y mi mejor 10K registrado es 1:03:57.' },
    { icon: '⚡', title: 'Ya tengo velocidad', text: 'Mi mejor km es 5:25 y mi mejor 5K es 29:55. El ritmo de sub-2 (5:41 por km) ya lo he tocado en distancias cortas.' },
    { icon: '📈', title: 'Mucho por mejorar', text: 'Llevo menos de un año registrando actividad y hoy hago de 3 a 4 sesiones por semana. Todo lo que viene es progreso.' }
  ];

  var CHALLENGES = [
    {
      icon: '📅', title: 'La constancia',
      text: 'Las ganas suben y bajan. Lo que me lleva a la meta es el hábito.',
      how: 'Marco cada sesión en esta web y celebro cada semana completa. Cuando baje el entusiasmo (suele pasar entre las semanas 6 y 10), me apoyo en la rutina.'
    },
    {
      icon: '🍓', title: 'Mejorar mi alimentación',
      text: 'Comer bien alrededor de los entrenos y ordenar el dulce. El postre no se prohíbe: se programa.',
      how: 'Proteína y carbohidrato después de entrenar, algo ligero antes, y un postre elegido en vez de dulces sueltos durante la semana.'
    },
    {
      icon: '⏱️', title: 'Correr a ritmo parejo',
      text: 'En mi 10K mis parciales fueron desde 5:55 hasta 6:49 por km.',
      how: 'Salir tranquila, y en los fondos mantener todos los parciales dentro de 10 segundos entre sí.'
    },
    {
      icon: '🐢', title: 'Paciencia con los kilómetros',
      text: 'Subir rápido es la forma más fácil de lesionarse.',
      how: 'Aumento poco a poco y respeto las semanas de descarga, aunque me sienta con fuerza.'
    },
    {
      icon: '🧘', title: 'Cuidar mi cuerpo',
      text: 'Correr más pide fuerza, movilidad y descanso.',
      how: 'Gym, foam roller, un masaje deportivo cada 3 o 4 semanas, dormir de 7,5 a 8 horas y un chequeo médico al inicio.'
    },
    {
      icon: '🥇', title: 'Aprender a competir',
      text: 'Los 10K y el 21K de prueba son entrenamientos con dorsal.',
      how: 'Practico el ritmo, la hidratación y el desayuno del día de carrera para que el 22 de agosto no tenga sorpresas.'
    }
  ];

  var LEVELS = [
    { cls: 'a', name: 'Meta A', goal: 'Menos de 2:00', text: 'La meta grande: 21,1 km a 5:41 por km.' },
    { cls: 'b', name: 'Meta B', goal: '2:05 a 2:10', text: 'Una marca excelente si el camino se complica un poco.' },
    { cls: 'c', name: 'Meta C', goal: 'Llegar fuerte', text: 'Terminar bien, feliz y sin lesión. Ya es una gran victoria.' }
  ];

  var STARTPOINT = [
    { label: '5K',  from: '29:55',       fromNote: 'mi mejor hoy',   to: '26:05',    toNote: 'aprox. necesario' },
    { label: '10K', from: '1:03:57',     fromNote: 'mi mejor hoy',   to: '54:25',    toNote: 'aprox. necesario' },
    { label: 'Km/sem', from: '6 a 7',    fromNote: 'corriendo hoy',  to: '30 a 40',  toNote: 'en el pico del plan' }
  ];

  /* ---------------- UTILIDADES ---------------- */

  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function todayStr() {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
  }

  function fmtShort(iso) {
    var p = iso.split('-');
    return parseInt(p[2], 10) + ' ' + MES[parseInt(p[1], 10) - 1];
  }

  var store = {
    get: function (k) {
      try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return {}; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ }
    }
  };

  function phaseById(id) {
    for (var i = 0; i < PHASES.length; i++) if (PHASES[i].id === id) return PHASES[i];
    return PHASES[0];
  }

  /* ---------------- NAVEGACIÓN ---------------- */

  var VIEWS = ['semana', 'mejor', 'meta'];

  function route(initial) {
    var v = (location.hash || '#semana').slice(1);
    if (VIEWS.indexOf(v) === -1) v = 'semana';
    VIEWS.forEach(function (name) {
      var el = document.getElementById('view-' + name);
      if (el) el.hidden = name !== v;
    });
    $$('.topnav a').forEach(function (a) {
      if (a.dataset.view === v) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (!initial) window.scrollTo(0, 0);
  }

  /* ---------------- CUENTA REGRESIVA ---------------- */

  function addMonths(d, n) {
    var r = new Date(d.getTime());
    var day = r.getDate();
    r.setDate(1);
    r.setMonth(r.getMonth() + n);
    var dim = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(day, dim));
    return r;
  }

  function remaining(now, target) {
    if (target <= now) return { m: 0, d: 0, h: 0, mi: 0, s: 0 };
    var m = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    if (addMonths(now, m) > target) m--;
    var ms = target - addMonths(now, m);
    var d = Math.floor(ms / 864e5); ms -= d * 864e5;
    var h = Math.floor(ms / 36e5);  ms -= h * 36e5;
    var mi = Math.floor(ms / 6e4);  ms -= mi * 6e4;
    var s = Math.floor(ms / 1e3);
    return { m: m, d: d, h: h, mi: mi, s: s };
  }

  function tick() {
    var r = remaining(new Date(), RACE);
    $('#cd-months').textContent = pad(r.m);
    $('#cd-days').textContent = pad(r.d);
    $('#cd-hours').textContent = pad(r.h);
    $('#cd-minutes').textContent = pad(r.mi);
    $('#cd-seconds').textContent = pad(r.s);
  }

  /* ---------------- SEMANA ---------------- */

  var weekIndex = 0;
  var openDay = null;

  function defaultWeekIndex() {
    var t = todayStr(), idx = 0;
    WEEKS.forEach(function (w, i) { if (t >= w.start) idx = i; });
    return idx;
  }

  function weekKey(w) { return 'claudia-plan:' + w.id; }

  function dayHTML(d, done, isOpen, isToday) {
    var t = TYPES[d.type];
    var checkable = d.core || d.extra;
    return '' +
      '<article class="day' + (isOpen ? ' open' : '') + (done ? ' is-done' : '') + (isToday ? ' is-today' : '') + '" data-key="' + d.key + '" style="--type:' + t.color + ';--type-ink:' + t.ink + '">' +
        '<div class="day-head">' +
          '<button class="day-toggle" type="button" aria-expanded="' + isOpen + '" aria-controls="body-' + d.key + '">' +
            '<span class="day-date"><b>' + d.dow + '</b><i>' + d.num + '</i></span>' +
            '<span class="day-main">' +
              '<span class="badge">' + t.label + '</span>' + (d.extra ? '<span class="extra-flag">extra</span>' : '') +
              '<span class="day-title">' + d.title + '</span>' +
              '<span class="day-meta">' + d.meta + '</span>' +
            '</span>' +
            '<span class="chev" aria-hidden="true">›</span>' +
          '</button>' +
          (checkable ? '<div class="day-check-wrap"><button class="day-check" type="button" aria-pressed="' + !!done + '" aria-label="Marcar como hecha: ' + d.title + '">✓</button></div>' : '') +
        '</div>' +
        '<div class="day-body" id="body-' + d.key + '"><div class="day-body-inner"><div class="day-content">' +
          (d.focus ? '<p class="focus">' + d.focus + '</p>' : '') +
          '<ul>' + d.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
          '<p class="tip">💡 ' + d.tip + '</p>' +
        '</div></div></div>' +
      '</article>';
  }

  function renderWeek() {
    var w = WEEKS[weekIndex];
    var done = store.get(weekKey(w));
    var today = todayStr();

    if (!openDay) {
      var todays = w.days.filter(function (d) { return d.date === today; })[0];
      openDay = (todays || w.days[0]).key;
    }

    var nav = WEEKS.length > 1
      ? '<div class="week-nav">' +
          '<button type="button" id="prevWeek" aria-label="Semana anterior"' + (weekIndex === 0 ? ' disabled' : '') + '>‹</button>' +
          '<button type="button" id="nextWeek" aria-label="Semana siguiente"' + (weekIndex === WEEKS.length - 1 ? ' disabled' : '') + '>›</button>' +
        '</div>'
      : '';

    var html = '' +
      '<div class="week-head">' + nav +
        '<h2 class="week-title">' + w.title + '</h2>' +
        '<p class="week-range">' + w.range + '</p>' +
        '<span class="week-phase">' + w.phase + '</span>' +
        '<p class="week-goal">' + w.goal + '</p>' +
      '</div>' +
      '<div class="progress" id="progress">' +
        '<div class="progress-top"><span>Mis sesiones</span><b id="progressCount"></b></div>' +
        '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="progressBar"><div class="bar-fill" id="progressFill"></div></div>' +
        '<p class="progress-msg" id="progressMsg"></p>' +
      '</div>' +
      '<div class="days">' +
        w.days.map(function (d) { return dayHTML(d, done[d.key], d.key === openDay, d.date === today); }).join('') +
      '</div>' +
      '<h3 class="section-title rules-title">Mis reglas de la semana</h3>' +
      '<div class="rules">' +
        w.rules.map(function (r) { return '<div class="rule"><h4>' + r.title + '</h4>' + r.html + '</div>'; }).join('') +
      '</div>';

    $('#weekApp').innerHTML = html;
    updateProgress(false);
  }

  function updateProgress(celebrate) {
    var w = WEEKS[weekIndex];
    var done = store.get(weekKey(w));
    var core = w.days.filter(function (d) { return d.core; });
    var n = core.filter(function (d) { return done[d.key]; }).length;
    var pct = core.length ? Math.round(n / core.length * 100) : 0;

    $('#progressCount').textContent = n + ' de ' + core.length;
    $('#progressFill').style.width = pct + '%';
    $('#progressBar').setAttribute('aria-valuenow', pct);

    var msg;
    if (n === 0) msg = 'Toco el círculo de cada día cuando termino la sesión.';
    else if (n < core.length / 2) msg = '¡Buen comienzo! Cada sesión suma.';
    else if (n < core.length) msg = '¡Ya pasé la mitad! Sigo así.';
    else msg = '¡Semana completa! Eso es constancia 💖';
    $('#progressMsg').textContent = msg;

    $('#progress').classList.toggle('done', n === core.length && core.length > 0);
    if (celebrate && n === core.length && core.length > 0) confetti();
  }

  function toggleDone(dayEl) {
    var w = WEEKS[weekIndex];
    var done = store.get(weekKey(w));
    var key = dayEl.dataset.key;
    done[key] = !done[key];
    store.set(weekKey(w), done);
    dayEl.classList.toggle('is-done', !!done[key]);
    $('.day-check', dayEl).setAttribute('aria-pressed', String(!!done[key]));
    updateProgress(!!done[key]);
  }

  function toggleOpen(dayEl) {
    var isOpen = !dayEl.classList.contains('open');
    dayEl.classList.toggle('open', isOpen);
    $('.day-toggle', dayEl).setAttribute('aria-expanded', String(isOpen));
    openDay = isOpen ? dayEl.dataset.key : null;
  }

  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var box = $('#confetti');
    var icons = ['💖', '🎀', '✨', '🏃‍♀️', '⭐'];
    for (var i = 0; i < 26; i++) {
      var s = document.createElement('span');
      s.textContent = icons[i % icons.length];
      s.style.left = Math.round(Math.random() * 96) + '%';
      s.style.animationDelay = (Math.random() * 0.7).toFixed(2) + 's';
      s.style.fontSize = (1.2 + Math.random() * 1.2).toFixed(1) + 'rem';
      box.appendChild(s);
    }
    setTimeout(function () { box.innerHTML = ''; }, 4200);
  }

  function bindWeek() {
    $('#weekApp').addEventListener('click', function (e) {
      var check = e.target.closest('.day-check');
      if (check) { toggleDone(check.closest('.day')); return; }
      var toggle = e.target.closest('.day-toggle');
      if (toggle) { toggleOpen(toggle.closest('.day')); return; }
      if (e.target.closest('#prevWeek') && weekIndex > 0) { weekIndex--; openDay = null; renderWeek(); return; }
      if (e.target.closest('#nextWeek') && weekIndex < WEEKS.length - 1) { weekIndex++; openDay = null; renderWeek(); }
    });
  }

  /* ---------------- LO MEJOR DE MÍ ---------------- */

  function renderMejor() {
    $('#strengths').innerHTML = STRENGTHS.map(function (s) {
      return '<div class="card"><span class="card-icon" aria-hidden="true">' + s.icon + '</span><h4>' + s.title + '</h4><p>' + s.text + '</p></div>';
    }).join('');

    $('#challenges').innerHTML = CHALLENGES.map(function (c) {
      return '<div class="card challenge"><span class="card-icon" aria-hidden="true">' + c.icon + '</span><h4>' + c.title + '</h4><p>' + c.text + '</p><div class="how"><b>Cómo lo hago:</b> ' + c.how + '</div></div>';
    }).join('');
  }

  /* ---------------- LA META ---------------- */

  function phaseStatus(p, today) {
    if (today < p.start) return { key: 'next', text: 'Empieza el ' + fmtShort(p.start) };
    if (today > p.end) return { key: 'past', text: 'Completada' };
    return { key: 'now', text: 'Estoy aquí' };
  }

  function renderMeta() {
    var today = todayStr();

    $('#levels').innerHTML = LEVELS.map(function (l) {
      return '<div class="level ' + l.cls + '"><p class="lv-name">' + l.name + '</p><p class="lv-goal">' + l.goal + '</p><p>' + l.text + '</p></div>';
    }).join('');

    $('#startpoint').innerHTML = STARTPOINT.map(function (r) {
      return '<div class="pt-row">' +
        '<span class="pt-label">' + r.label + '</span>' +
        '<span class="pt-val">' + r.from + '<small>' + r.fromNote + '</small></span>' +
        '<span class="pt-arrow" aria-hidden="true">→</span>' +
        '<span class="pt-val to">' + r.to + '<small>' + r.toNote + '</small></span>' +
      '</div>';
    }).join('');

    var current = PHASES.filter(function (p) { return phaseStatus(p, today).key === 'now'; })[0] || PHASES[0];

    $('#phases').innerHTML = PHASES.map(function (p, i) {
      var st = phaseStatus(p, today);
      var open = p.id === current.id;
      return '' +
        '<article class="phase' + (open ? ' open' : '') + '" data-status="' + st.key + '" style="--c:' + p.color + '">' +
          '<button class="phase-btn" type="button" aria-expanded="' + open + '" aria-controls="ph-' + p.id + '">' +
            '<span class="phase-num" aria-hidden="true">' + (i + 1) + '</span>' +
            '<span>' +
              '<span class="phase-name">' + p.name + '</span>' +
              '<span class="phase-motto">“' + p.motto + '”</span>' +
              '<span class="phase-status">' + st.text + '</span>' +
            '</span>' +
            '<span class="chev" aria-hidden="true" style="margin-left:auto">›</span>' +
          '</button>' +
          '<div class="phase-body" id="ph-' + p.id + '"><div class="phase-body-inner"><div class="phase-content">' +
            '<p class="phase-dates">' + fmtShort(p.start) + ' al ' + fmtShort(p.end) + ' · ' + p.weeks + ' semanas</p>' +
            '<p>' + p.what + '</p>' +
            '<dl>' +
              '<div><dt>En el gym</dt><dd>' + p.gym + '</dd></div>' +
              '<div><dt>Mis pruebas</dt><dd>' + p.test + '</dd></div>' +
            '</dl>' +
          '</div></div></div>' +
        '</article>';
    }).join('');

    var ym = today.slice(0, 7);
    $('#months').innerHTML = MONTHS.map(function (m) {
      var isNow = ym === m.y + '-' + pad(m.m + 1);
      var first = phaseById(m.ph[0]);
      return '' +
        '<li class="month' + (isNow ? ' now' : '') + '" style="--c:' + first.color + '">' +
          '<div class="month-card">' +
            '<div class="month-top">' +
              '<span class="month-name">' + m.name + '</span>' +
              (isNow ? '<span class="badge-now">Estoy aquí</span>' : '') +
              m.ph.map(function (id) {
                var p = phaseById(id);
                return '<span class="chip" style="--c:' + p.color + '">' + p.name + '</span>';
              }).join('') +
              '<span class="chip km">' + m.km + ' km/sem</span>' +
            '</div>' +
            '<p class="month-focus">' + m.focus + '</p>' +
            '<p class="month-hito">' + m.hito + '</p>' +
          '</div>' +
        '</li>';
    }).join('');

    $('#phases').addEventListener('click', function (e) {
      var btn = e.target.closest('.phase-btn');
      if (!btn) return;
      var card = btn.closest('.phase');
      var open = !card.classList.contains('open');
      card.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------------- INICIO ---------------- */

  function init() {
    weekIndex = defaultWeekIndex();
    renderWeek();
    bindWeek();
    renderMejor();
    renderMeta();
    tick();
    setInterval(tick, 1000);
    route(true);
    window.addEventListener('hashchange', function () { route(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
