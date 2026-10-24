'use client';

import { Gate } from '@/components/Gate';
import { TopNav } from '@/components/TopNav';
import { LEGAL_VERSION } from '@/lib/legal';
import './arquitectura.css';

/**
 * Sección "Docs" del panel coach (antes "Arquitectura"): cómo está construida la app, sus agentes
 * y sus ciclos automáticos. Es solo lectura y la ve únicamente el coach.
 */
export default function ArquitecturaPage() {
  return (
    <Gate role="admin">
      {() => (
        <>
          <TopNav />
          <Arquitectura />
        </>
      )}
    </Gate>
  );
}

// Modelo que usa el agente (ver HEAD_COACH_MODEL en src/lib/agent/headCoach.ts).
const HEAD_COACH_MODEL_LABEL = 'Claude Sonnet 5.5';

const TOC = [
  ['vista', 'Vista general'],
  ['stack', 'Tecnologías'],
  ['datos', 'Datos'],
  ['seguridad', 'Seguridad'],
  ['agentes', 'Agentes'],
  ['ciclos', 'Ciclos automáticos'],
  ['entrega', 'Desarrollo y despliegue'],
  ['costos', 'Costos y límites'],
  ['siguiente', 'Lo que viene'],
] as const;

function Arquitectura() {
  return (
    <main className="wrap arch">
      <h3 className="section-title">Cómo está construida Training Please</h3>
      <p className="section-sub">
        Una app web única (sitio público, app del atleta y panel del coach) en Next.js sobre Vercel, con Firebase para
        identidad y datos, y un agente de IA que arma cada semana con Claude. Las reglas de seguridad del entrenamiento
        las valida el código, no el modelo, y el coach puede corregir cualquier semana.
      </p>
      <ul className="arch-toc">
        {TOC.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
      </ul>

      <h3 className="section-title" id="vista">Vista general</h3>
      <p className="section-sub">Qué piezas hay y cómo se hablan. Todo corre en servicios administrados: no hay servidores propios que mantener.</p>
      <SystemDiagram />

      <h4>Un pedido, de punta a punta</h4>
      <ol>
        <li>El atleta abre la app y entra con su cuenta de Google (Firebase Auth). Solo entran los correos que el coach dio de alta.</li>
        <li>La primera vez, <code>/api/bootstrap</code> verifica el token en el servidor, crea su perfil y le pone el rol (<code>athlete</code> o <code>admin</code>) como <i>custom claim</i>.</li>
        <li>La app lee su plan y escribe sus registros directo en Firestore con el SDK del navegador. Las reglas de Firestore deciden qué puede leer y escribir cada uno.</li>
        <li>Lo sensible (altas, planes, propuestas del agente, solicitudes del sitio) pasa por las API del servidor, que usan el Admin SDK y exigen el rol de coach.</li>
        <li>El domingo a las 4 pm Vercel Cron llama a <code>/api/cron/semanal</code>, que corre el agente para cada atleta con consentimiento vigente.</li>
      </ol>

      <h3 className="section-title" id="stack">Tecnologías</h3>
      <div className="table-wrap">
        <table className="sessions">
          <thead><tr><th>Capa</th><th>Tecnología</th><th>Para qué</th></tr></thead>
          <tbody>
            <tr><td>Framework</td><td>Next.js 16 (App Router) con React 19 y TypeScript 5.9</td><td>Un solo proyecto para el sitio, la app y las API. Las páginas son componentes cliente; las API son <i>route handlers</i> en Node.js.</td></tr>
            <tr><td>Estilos</td><td>CSS propio con variables, sin librería de UI</td><td>Tres temas (azul por defecto, oscuro para el panel del coach y rosa a elección) cambiando solo variables. Tipografías Oswald y Nunito Sans de Google Fonts.</td></tr>
            <tr><td>Hosting</td><td>Vercel (plan Hobby hoy, Pro al cobrar)</td><td>Despliegue continuo desde GitHub, CDN, funciones serverless (hasta 300 s por llamada) y cron.</td></tr>
            <tr><td>Identidad</td><td>Firebase Authentication con Google</td><td>Login sin contraseñas. El rol viaja en el token como <i>custom claim</i>.</td></tr>
            <tr><td>Base de datos</td><td>Cloud Firestore (NoSQL de documentos)</td><td>Perfiles, planes, registros, memoria del agente, propuestas y bitácora de corridas. Tiempo real en la app del atleta.</td></tr>
            <tr><td>SDK de datos</td><td><code>firebase</code> 12 (navegador) y <code>firebase-admin</code> 13 (servidor)</td><td>El navegador queda limitado por las reglas; el servidor tiene acceso completo y por eso solo corre en las API.</td></tr>
            <tr><td>IA</td><td>Claude API de Anthropic con <code>@anthropic-ai/sdk</code>, modelo {HEAD_COACH_MODEL_LABEL}</td><td>Escribe la semana. Respuesta en streaming, razonamiento adaptativo, esfuerzo alto, salida forzada a un esquema JSON y modelo de respaldo si el principal no responde.</td></tr>
            <tr><td>Tareas programadas</td><td>Vercel Cron (<code>vercel.json</code>)</td><td>Dispara el ciclo semanal el domingo a las 21:00 UTC (4 pm en Lima).</td></tr>
            <tr><td>Pruebas</td><td><code>node --test</code>, emuladores de Firebase y <code>@firebase/rules-unit-testing</code></td><td>Pruebas del agente, fechas y formatos; pruebas de las reglas de Firestore; pruebas de punta a punta con un Claude simulado.</td></tr>
            <tr><td>Código</td><td>GitHub (repositorio público)</td><td>Cada cambio entra por pull request, con su vista previa en Vercel. Las claves viven en Vercel, nunca en el código.</td></tr>
          </tbody>
        </table>
      </div>

      <h3 className="section-title" id="datos">Datos</h3>
      <p className="section-sub">Colecciones de Firestore. Cada atleta tiene su propio árbol bajo su identificador, así nada de un atleta queda al alcance de otro.</p>
      <div className="table-wrap">
        <table className="sessions">
          <thead><tr><th>Ruta</th><th>Contenido</th><th>Quién escribe</th></tr></thead>
          <tbody>
            <tr><td><code>users/&#123;uid&#125;</code></td><td>Perfil, rol, tema, carrera objetivo, membresía y consentimiento.</td><td>Servidor al crear; el atleta edita sus campos; el coach el resto.</td></tr>
            <tr><td><code>allowlist/&#123;correo&#125;</code></td><td>Correos dados de alta que pueden entrar.</td><td>Solo servidor.</td></tr>
            <tr><td><code>plans/&#123;uid&#125;/weeks/&#123;semana&#125;/sessions</code></td><td>El plan: semanas (lunes a domingo, id ISO tipo 2026-W44) y sus sesiones.</td><td>Coach o agente (servidor).</td></tr>
            <tr><td><code>logs/&#123;uid&#125;/entries/&#123;sesión&#125;</code></td><td>Registro de cada sesión: hecha, RPE de 1 a 10 y comentario. Ahí también va el aviso del atleta para la próxima semana.</td><td>Solo el atleta, y solo con consentimiento.</td></tr>
            <tr><td><code>athleteMemory/&#123;uid&#125;</code></td><td>Ficha para el agente (meta, lesiones, reglas personales), forma actual, nota del coach para la semana e historial de decisiones.</td><td>Coach y agente (servidor).</td></tr>
            <tr><td><code>proposals/&#123;uid&#125;/weeks/&#123;semana&#125;</code></td><td>Propuestas del agente: plan, decisión, alertas, observaciones del Guardián y estado (pendiente, aprobada, descartada).</td><td>Agente y coach (servidor).</td></tr>
            <tr><td><code>agentRuns</code></td><td>Bitácora de cada corrida: atleta, disparador, tokens, costo, intentos y errores.</td><td>Servidor.</td></tr>
            <tr><td><code>consents/&#123;uid&#125;/events</code></td><td>Evidencia del consentimiento: cada aceptación o retiro, con versión del texto.</td><td>El atleta, solo agregando (nunca se edita ni se borra).</td></tr>
            <tr><td><code>pilotRequests</code>, <code>investorContacts</code></td><td>Formularios del sitio público.</td><td>Solo servidor; el coach los lee.</td></tr>
          </tbody>
        </table>
      </div>

      <h3 className="section-title" id="seguridad">Seguridad y privacidad</h3>
      <ul>
        <li><b>Acceso cerrado:</b> solo entran correos de la lista de alta. No hay registro abierto ni invitación por enlace.</li>
        <li><b>Roles en el token:</b> el rol lo pone el servidor y las reglas de Firestore lo leen del token, así que nadie puede subirse de rango editando su perfil.</li>
        <li><b>Aislamiento:</b> un atleta solo lee y escribe bajo su propio identificador. El coach no ve los registros de quien retiró el consentimiento.</li>
        <li><b>Consentimiento versionado:</b> texto legal versión {LEGAL_VERSION} (Ley 29733 del Perú). Si cambia, cada atleta lo vuelve a aceptar al entrar. Nombra a Google, Vercel y Anthropic como proveedores fuera del Perú.</li>
        <li><b>Secretos:</b> <code>ANTHROPIC_API_KEY</code>, <code>CRON_SECRET</code> y la cuenta de servicio de Firebase viven como variables de entorno en Vercel. El cron solo se acepta con <code>Authorization: Bearer CRON_SECRET</code>.</li>
        <li><b>IA supervisada:</b> el agente no escribe nada que el Guardián rechace sin que el coach lo vea, y el coach puede corregir cualquier semana después.</li>
      </ul>

      <h3 className="section-title" id="agentes">Agentes</h3>
      <p className="section-sub">
        Un agente principal (Head Coach) coordina cuatro especialistas. Solo uno de ellos llama a Claude: los demás son
        código determinista y probado, lo que hace que el resultado sea predecible y barato.
      </p>
      <div className="arch-cards">
        <div className="arch-card accent">
          <h5>Head Coach</h5>
          <p>Arma el contexto, llama a Claude, pasa la respuesta por el Guardián y guarda la propuesta.</p>
          <small><code>headCoach.ts</code>, <code>run.ts</code></small>
        </div>
        <div className="arch-card">
          <h5>Análisis <span className="pill mint">código</span></h5>
          <p>Cumplimiento, km planeados y hechos, RPE sobre lo esperado y menciones de dolor o enfermedad en los comentarios.</p>
          <small><code>metrics.ts</code></small>
        </div>
        <div className="arch-card">
          <h5>Ciencia <span className="pill mint">código</span></h5>
          <p>Metodología de Jack Daniels con reglas basadas en evidencia: índice de forma, ritmos por zona y equivalencias de carrera.</p>
          <small><code>methodology.ts</code>, <code>fitness.ts</code></small>
        </div>
        <div className="arch-card">
          <h5>Plan <span className="pill">Claude</span></h5>
          <p>Escribe la semana en JSON: sesiones, ritmos, mensaje al atleta y alertas, con la decisión de bajar, mantener o progresar.</p>
          <small>{HEAD_COACH_MODEL_LABEL} con salida a esquema</small>
        </div>
        <div className="arch-card">
          <h5>Guardián <span className="pill mint">código</span></h5>
          <p>Reglas duras: subida semanal máxima, salida más larga, fondo hasta 150 min, topes por zona, días duros, taper y días suaves tras carrera.</p>
          <small><code>guardrails.ts</code></small>
        </div>
      </div>
      <AgentDiagram />

      <h4>Qué lee el agente de cada atleta</h4>
      <ul>
        <li>Perfil y carrera objetivo, ficha del agente y forma actual (tiempo de referencia y meta).</li>
        <li>El plan y los registros de las semanas recientes: hecho, RPE y el texto de cada comentario.</li>
        <li>El aviso del atleta para la próxima semana (viajes, días sin entrenar, logística) y la nota del coach para esa semana.</li>
        <li>Su propio historial de decisiones, para no repetir errores ni saltos bruscos.</li>
      </ul>
      <p>Si un comentario menciona dolor o enfermedad, el código obliga a bajar la carga aunque el modelo proponga otra cosa.</p>

      <h3 className="section-title" id="ciclos">Ciclos automáticos</h3>
      <p className="section-sub">El ciclo semanal corre solo el domingo. Además hay dos disparadores manuales desde la ficha de cada atleta.</p>
      <TimelineDiagram />
      <div className="table-wrap">
        <table className="sessions">
          <thead><tr><th>Disparador</th><th>Cuándo</th><th>Qué hace</th><th>Resultado</th></tr></thead>
          <tbody>
            <tr><td>Cron semanal</td><td>Domingo 4 pm Lima (<code>0 21 * * 0</code>)</td><td>Analiza la semana que cierra y propone la siguiente para cada atleta con consentimiento.</td><td>Se carga sola si el Guardián no deja observaciones; si deja, queda pendiente.</td></tr>
            <tr><td>Generar la semana siguiente ahora</td><td>Cuando el coach lo pide</td><td>Lo mismo que el cron, para un atleta.</td><td>Siempre queda pendiente para que el coach la apruebe.</td></tr>
            <tr><td>Pedir un ajuste</td><td>Cuando el coach lo pide, en texto</td><td>Cambia una semana ya cargada sin tocar sesiones pasadas o ya registradas.</td><td>Queda pendiente para que el coach la apruebe.</td></tr>
            <tr><td>Registro del atleta</td><td>Cada sesión, desde su día</td><td>Hecho, RPE y comentario en tiempo real.</td><td>El coach lo ve al instante y el agente lo lee el domingo.</td></tr>
          </tbody>
        </table>
      </div>

      <h3 className="section-title" id="entrega">Desarrollo y despliegue</h3>
      <ul>
        <li>Cada cambio se hace en una rama y entra por pull request en GitHub. Vercel publica una vista previa por cada PR.</li>
        <li>Al fusionar en <code>main</code>, Vercel construye y publica en producción (trainingplease.vercel.app) en un par de minutos.</li>
        <li>Antes de subir: <code>npm test</code>, chequeo de tipos con <code>tsc</code>, <code>next build</code> y, en lo que toca datos o al agente, una prueba con los emuladores de Firebase y un Claude simulado.</li>
        <li>Las reglas de Firestore (<code>firestore.rules</code>) se publican aparte, desde la consola de Firebase.</li>
        <li>La IA también participa en el desarrollo: el código lo escriben agentes de Claude Code con revisión del coach antes de cada fusión.</li>
      </ul>

      <h3 className="section-title" id="costos">Costos y límites</h3>
      <ul>
        <li><b>Agente:</b> unos 9.500 tokens de entrada por atleta y semana. Con {HEAD_COACH_MODEL_LABEL}, alrededor de US$0,60 por atleta cada 4 semanas. Solo gasta el cron del domingo y los botones que se tocan; cada corrida guarda su costo en <code>agentRuns</code>.</li>
        <li><b>Firebase:</b> dentro de la capa gratuita con el volumen actual.</li>
        <li><b>Vercel:</b> Hobby es gratis pero solo para uso no comercial, y su cron puede correr en cualquier minuto de la hora (entre 4:00 y 4:59). Al cobrar, plan Pro (US$20 al mes).</li>
        <li><b>Tiempo:</b> cada atleta toma de 1 a 3 minutos. Hoy el cron procesa a todos en paralelo dentro de una sola función de hasta 300 s.</li>
      </ul>

      <h3 className="section-title" id="siguiente">Lo que viene</h3>
      <ul>
        <li>Desde unos 10 atletas, una invocación del cron por atleta para no chocar con el límite de 300 s.</li>
        <li>Registrar también el costo del modelo de respaldo cuando entra en juego.</li>
        <li>Ciclo por bloque (cada 4 a 6 semanas) para revisar la progresión hacia la carrera, además del semanal.</li>
        <li>Dominio propio con correo (hola@trainingplease.app) y avisos por correo con Resend.</li>
        <li>Widgets en el celular con un enlace secreto y revocable por atleta.</li>
      </ul>
    </main>
  );
}

/* ---------- Diagramas (SVG con los colores del tema activo) ---------- */

function Markers() {
  return (
    <defs>
      <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" className="head" />
      </marker>
      <marker id="ah-y" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" className="head-y" />
      </marker>
      <marker id="ah-s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" className="head-soft" />
      </marker>
    </defs>
  );
}

function SystemDiagram() {
  return (
    <figure className="arch-figure">
      <svg viewBox="0 0 960 600" role="img" aria-labelledby="sys-title">
        <title id="sys-title">Diagrama de la arquitectura: usuarios, Vercel, Firebase y Anthropic</title>
        <Markers />

        {/* Usuarios */}
        <rect className="zone" x="10" y="40" width="180" height="330" rx="16" />
        <text className="zone-label" x="24" y="62">Usuarios</text>
        <rect className="box" x="30" y="80" width="140" height="62" rx="12" />
        <text className="t-title" x="100" y="106" textAnchor="middle">Visitante</text>
        <text className="t-small" x="100" y="126" textAnchor="middle">sitio público /</text>
        <rect className="box" x="30" y="170" width="140" height="70" rx="12" />
        <text className="t-title" x="100" y="196" textAnchor="middle">Atleta</text>
        <text className="t-small" x="100" y="214" textAnchor="middle">celular o computadora</text>
        <text className="t-small" x="100" y="230" textAnchor="middle">/plan · /ajustes</text>
        <rect className="box-accent" x="30" y="270" width="140" height="70" rx="12" />
        <text className="t-title t-dark" x="100" y="298" textAnchor="middle">Coach</text>
        <text className="t-small t-dark" x="100" y="318" textAnchor="middle">/coach · ficha · agente</text>

        <path className="line" d="M170 111H205M170 205H205M170 305H205M205 111V305" fill="none" />
        <path className="arrow" d="M205 122H238" markerEnd="url(#ah)" />

        {/* Vercel */}
        <rect className="zone" x="220" y="40" width="440" height="460" rx="16" />
        <text className="zone-label" x="234" y="62">Vercel · hosting y funciones Node.js</text>

        <rect className="box" x="240" y="75" width="400" height="95" rx="14" />
        <text className="t-title" x="440" y="100" textAnchor="middle">Next.js 16 · React 19 · App Router</text>
        <text x="440" y="122" textAnchor="middle">Sitio público, login, Mi semana, Ajustes y Legal</text>
        <text x="440" y="140" textAnchor="middle">Panel coach: atletas, ficha, agente y arquitectura</text>
        <text className="t-small" x="440" y="159" textAnchor="middle">componentes cliente · CSS con temas azul, oscuro y rosa</text>

        <path className="arrow" d="M440 170V208" markerEnd="url(#ah)" />
        <text className="t-small" x="448" y="194">fetch con ID token</text>

        <rect className="box" x="240" y="210" width="400" height="95" rx="14" />
        <text className="t-title" x="440" y="235" textAnchor="middle">API routes (servidor)</text>
        <text x="440" y="257" textAnchor="middle">/api/bootstrap · /api/admin/* · /api/solicitudes</text>
        <text x="440" y="275" textAnchor="middle">/api/agent/run · /api/cron/semanal · /api/health</text>
        <text className="t-small" x="440" y="294" textAnchor="middle">verifican el token de Firebase y el rol de coach</text>

        <rect className="box-mint" x="240" y="345" width="115" height="130" rx="14" />
        <text className="t-title t-dark" x="297" y="372" textAnchor="middle">Vercel Cron</text>
        <text className="t-dark" x="297" y="398" textAnchor="middle">domingo</text>
        <text className="t-dark" x="297" y="416" textAnchor="middle">4 pm Lima</text>
        <text className="t-small t-dark" x="297" y="438" textAnchor="middle">0 21 * * 0 UTC</text>
        <text className="t-small t-dark" x="297" y="456" textAnchor="middle">CRON_SECRET</text>
        <path className="arrow" d="M297 345V307" markerEnd="url(#ah)" />

        <rect className="box-accent" x="370" y="345" width="270" height="130" rx="14" />
        <text className="t-title t-dark" x="505" y="372" textAnchor="middle">Agente Head Coach</text>
        <text className="t-dark" x="505" y="396" textAnchor="middle">Análisis · Ciencia · Plan · Guardián</text>
        <text className="t-small t-dark" x="505" y="418" textAnchor="middle">reglas duras validadas por código</text>
        <text className="t-small t-dark" x="505" y="436" textAnchor="middle">hasta 3 intentos de corrección</text>
        <text className="t-small t-dark" x="505" y="456" textAnchor="middle">src/lib/agent</text>
        <path className="arrow" d="M505 305V343" markerEnd="url(#ah)" />

        {/* Firebase */}
        <rect className="zone" x="690" y="40" width="260" height="290" rx="16" />
        <text className="zone-label" x="704" y="62">Google Firebase</text>
        <rect className="box" x="710" y="75" width="220" height="85" rx="14" />
        <text className="t-title" x="820" y="100" textAnchor="middle">Firebase Auth</text>
        <text x="820" y="122" textAnchor="middle">login con Google</text>
        <text className="t-small" x="820" y="142" textAnchor="middle">rol en custom claim</text>
        <rect className="box" x="710" y="185" width="220" height="125" rx="14" />
        <text className="t-title" x="820" y="210" textAnchor="middle">Cloud Firestore</text>
        <text x="820" y="232" textAnchor="middle">users · plans · logs</text>
        <text x="820" y="250" textAnchor="middle">athleteMemory · proposals</text>
        <text x="820" y="268" textAnchor="middle">agentRuns · allowlist · consents</text>
        <text className="t-small" x="820" y="292" textAnchor="middle">reglas por rol y consentimiento</text>

        <path className="arrow" d="M640 100H708" markerEnd="url(#ah)" />
        <text className="t-small" x="674" y="93" textAnchor="middle">login</text>
        <path className="arrow" d="M640 150L708 215" markerEnd="url(#ah)" />
        <text className="t-small" x="676" y="150" textAnchor="middle">SDK</text>
        <path className="arrow" d="M640 285H708" markerEnd="url(#ah)" />
        <text className="t-small" x="674" y="278" textAnchor="middle">Admin</text>

        {/* Anthropic */}
        <rect className="zone" x="690" y="360" width="260" height="125" rx="16" />
        <text className="zone-label" x="704" y="382">Anthropic</text>
        <rect className="box" x="710" y="395" width="220" height="75" rx="14" />
        <text className="t-title" x="820" y="420" textAnchor="middle">Claude API</text>
        <text x="820" y="440" textAnchor="middle">{HEAD_COACH_MODEL_LABEL}</text>
        <text className="t-small" x="820" y="458" textAnchor="middle">salida JSON con esquema</text>
        <path className="arrow-y" d="M640 432H708" markerEnd="url(#ah-y)" />
        <path className="arrow" d="M640 362L770 312" markerEnd="url(#ah)" />
        <text className="t-small" x="664" y="350">lee y guarda</text>

        {/* GitHub */}
        <rect className="box-ext" x="220" y="530" width="200" height="54" rx="12" />
        <text className="t-title" x="320" y="553" textAnchor="middle">GitHub</text>
        <text className="t-small" x="320" y="572" textAnchor="middle">repositorio del código</text>
        <path className="arrow-soft" d="M320 530V502" markerEnd="url(#ah-s)" />
        <text className="t-small" x="440" y="553">pull request = vista previa</text>
        <text className="t-small" x="440" y="572">fusión en main = producción</text>
      </svg>
      <figcaption>Todo viaja por HTTPS. Flechas azules: llamadas de la app. Amarilla: la única llamada a la IA. Punteada: despliegue desde GitHub.</figcaption>
    </figure>
  );
}

function AgentDiagram() {
  const steps = [
    { x: 15, title: 'Contexto', lines: ['perfil, ficha, plan', 'registros, avisos', 'y nota del coach'], file: 'context.ts' },
    { x: 180, title: 'Análisis', lines: ['cumplimiento, km', 'RPE, dolor', 'y enfermedad'], file: 'metrics.ts' },
    { x: 345, title: 'Ciencia', lines: ['forma actual', 'ritmos por zona', 'topes de carga'], file: 'fitness.ts' },
    { x: 510, title: 'Plan', lines: ['Claude escribe', 'la semana', 'en JSON'], file: 'Claude API', accent: true },
    { x: 675, title: 'Guardián', lines: ['reglas duras', 'por código', 'sin excepciones'], file: 'guardrails.ts' },
  ];
  return (
    <figure className="arch-figure">
      <svg viewBox="0 0 960 360" role="img" aria-labelledby="agent-title">
        <title id="agent-title">Cómo el agente arma una semana</title>
        <Markers />
        {steps.map((s, i) => (
          <g key={s.title}>
            <rect className={s.accent ? 'box-accent' : 'box'} x={s.x} y="40" width="150" height="110" rx="14" />
            <text className={`t-title${s.accent ? ' t-dark' : ''}`} x={s.x + 75} y="66" textAnchor="middle">{i + 1}. {s.title}</text>
            {s.lines.map((l, k) => (
              <text key={l} className={s.accent ? 't-dark' : undefined} x={s.x + 75} y={88 + k * 17} textAnchor="middle">{l}</text>
            ))}
            <text className={`t-small${s.accent ? ' t-dark' : ''}`} x={s.x + 75} y="142" textAnchor="middle">{s.file}</text>
            {i < steps.length - 1 && <path className="arrow" d={`M${s.x + 150} 95H${s.x + 163}`} markerEnd="url(#ah)" />}
          </g>
        ))}
        <path className="arrow" d="M825 95H838" markerEnd="url(#ah)" />
        <rect className="box-sky" x="840" y="40" width="110" height="110" rx="14" />
        <text className="t-title" x="895" y="70" textAnchor="middle">6. Propuesta</text>
        <text x="895" y="94" textAnchor="middle">proposals</text>
        <text className="t-small" x="895" y="114" textAnchor="middle">con alertas</text>
        <text className="t-small" x="895" y="130" textAnchor="middle">y su costo</text>

        <path className="arrow-y" d="M750 150V180H585V152" markerEnd="url(#ah-y)" />
        <text className="t-small" x="667" y="196" textAnchor="middle">si algo falla, corrige (hasta 3 intentos)</text>

        <rect className="box" x="30" y="230" width="260" height="70" rx="14" />
        <text className="t-title" x="160" y="258" textAnchor="middle">El atleta ve su semana</text>
        <text className="t-small" x="160" y="280" textAnchor="middle">en Mi semana, al instante</text>

        <rect className="box-mint" x="330" y="230" width="260" height="70" rx="14" />
        <text className="t-title t-dark" x="460" y="258" textAnchor="middle">Carga automática</text>
        <text className="t-small t-dark" x="460" y="280" textAnchor="middle">cron del domingo y sin observaciones</text>
        <path className="arrow" d="M880 150V212H460V228" markerEnd="url(#ah)" />
        <path className="arrow" d="M330 265H292" markerEnd="url(#ah)" />

        <rect className="box-accent" x="630" y="230" width="170" height="70" rx="14" />
        <text className="t-title t-dark" x="715" y="258" textAnchor="middle">Pendiente</text>
        <text className="t-small t-dark" x="715" y="280" textAnchor="middle">Aprobar, Editar o Descartar</text>
        <path className="arrow" d="M915 150V265H802" markerEnd="url(#ah)" />
        <text className="t-small" x="858" y="288" textAnchor="middle">si hay</text>
        <text className="t-small" x="858" y="302" textAnchor="middle">observaciones</text>
        <text className="t-small" x="858" y="316" textAnchor="middle">o es manual</text>
        <path className="arrow" d="M715 300V335H160V302" markerEnd="url(#ah)" />
        <text className="t-small" x="445" y="352" textAnchor="middle">el coach aprueba</text>
      </svg>
      <figcaption>Solo el paso 4 usa IA. Los pasos 1, 2, 3 y 5 son código con pruebas, por eso la regla nunca depende del modelo.</figcaption>
    </figure>
  );
}

function TimelineDiagram() {
  return (
    <figure className="arch-figure">
      <svg viewBox="0 0 960 260" role="img" aria-labelledby="time-title">
        <title id="time-title">Ciclo semanal del agente</title>
        <Markers />
        <path className="arrow-y" d="M330 196H598" markerStart="url(#ah-y)" markerEnd="url(#ah-y)" />
        <text className="t-small" x="465" y="188" textAnchor="middle">hasta las 4 pm: avisos del atleta y nota del coach</text>
        <path className="arrow" d="M40 110H925" markerEnd="url(#ah)" />

        <circle className="dot" cx="70" cy="110" r="8" />
        <text className="t-title" x="70" y="62" textAnchor="middle">Lun a dom</text>
        <text className="t-small" x="70" y="80" textAnchor="middle">entrena y registra</text>
        <text className="t-small" x="120" y="150" textAnchor="middle">hecho, RPE y comentario</text>
        <text className="t-small" x="120" y="166" textAnchor="middle">el coach lo ve al instante</text>

        <circle className="dot" cx="330" cy="110" r="8" />
        <text className="t-title" x="330" y="62" textAnchor="middle">Dom 12:00</text>
        <text className="t-small" x="330" y="80" textAnchor="middle">cierra la semana</text>

        <circle className="dot-y" cx="600" cy="110" r="11" />
        <text className="t-title" x="600" y="62" textAnchor="middle">Dom 4:00 pm</text>
        <text className="t-small" x="600" y="80" textAnchor="middle">el cron corre el agente</text>
        <text className="t-small" x="600" y="150" textAnchor="middle">en Hobby, entre 4:00 y 4:59</text>
        <text className="t-small" x="600" y="166" textAnchor="middle">1 a 3 min por atleta</text>

        <circle className="dot" cx="770" cy="110" r="8" />
        <text className="t-title" x="770" y="62" textAnchor="middle">Dom tarde</text>
        <text className="t-small" x="770" y="80" textAnchor="middle">el coach revisa</text>
        <text className="t-small" x="770" y="150" textAnchor="middle">solo lo que quedó</text>
        <text className="t-small" x="770" y="166" textAnchor="middle">pendiente</text>

        <circle className="dot" cx="900" cy="110" r="8" />
        <text className="t-title" x="900" y="62" textAnchor="middle">Lunes</text>
        <text className="t-small" x="900" y="80" textAnchor="middle">semana nueva</text>
        <text className="t-small" x="900" y="150" textAnchor="middle">ya cargada</text>

        <text className="t-small" x="480" y="244" textAnchor="middle">El atleta tiene su plan el mismo domingo para organizarse.</text>
      </svg>
    </figure>
  );
}
