// Textos legales. Fuente: train-please/02-legal-disclaimer-terminos-consentimiento.md
// BORRADOR pendiente de revisión por abogado. Al cambiar un texto, sube LEGAL_VERSION:
// la app pedirá una nueva aceptación en el siguiente acceso.

export const LEGAL_VERSION = '1.0-borrador';
export const LEGAL_IS_DRAFT = true;

export const OWNER = '[Razón social]';
export const PRIVACY_EMAIL = '[correo de privacidad]';

export const REQUIRED_CHECKS = [
  { key: 'adult', text: 'Soy mayor de 18 años.' },
  {
    key: 'health',
    text: 'Declaro que estoy en condiciones de salud para hacer actividad física, que consulté o consultaré a un médico antes de iniciar un plan, y que informaré a mi coach de cualquier lesión, enfermedad o síntoma.',
  },
  {
    key: 'risk',
    text: 'Entiendo que el deporte implica riesgos (lesiones, problemas cardiovasculares, accidentes) y que soy responsable de cómo y cuándo entreno. Leí el Aviso de responsabilidad.',
  },
  { key: 'terms', text: 'Acepto los Términos y Condiciones.' },
  {
    key: 'data',
    text: `He leído la Política de Datos Personales y, de forma libre, previa, expresa, inequívoca e informada, autorizo a ${OWNER} a tratar mis datos personales, incluidos mis datos de salud, para las finalidades necesarias, y su almacenamiento con proveedores ubicados fuera del Perú. Sé que puedo revocar esta autorización en cualquier momento desde Ajustes > Privacidad o escribiendo a ${PRIVACY_EMAIL}.`,
  },
] as const;

export const OPTIONAL_CHECKS = [
  { key: 'ai', text: 'Generar o ajustar mis planes con herramientas de inteligencia artificial, siempre con revisión de mi coach.' },
  { key: 'marketing', text: 'Recibir novedades, promociones y servicios de Train Please.' },
  { key: 'stats', text: 'Usar mis datos anonimizados para mejorar los planes y elaborar estadísticas.' },
] as const;

export interface LegalSection { title: string; items: string[] }

export const DISCLAIMER: LegalSection = {
  title: 'Aviso de responsabilidad',
  items: [
    'No es consejo médico. Los planes, recomendaciones y contenidos de Train Please, sean elaborados por un coach o generados o asistidos por inteligencia artificial, son orientaciones de entrenamiento deportivo. No constituyen diagnóstico, tratamiento ni consejo médico, nutricional o fisioterapéutico.',
    'Evaluación médica. El usuario declara haberse sometido, o se compromete a someterse, a una evaluación médica que lo habilite para la actividad física propuesta, en especial si tiene más de 35 años, antecedentes cardiacos, hipertensión, diabetes, lesiones previas o está embarazada.',
    'Asunción del riesgo. La práctica deportiva conlleva riesgos inherentes. El usuario los conoce, los acepta y decide libremente seguir o no cada sesión, adaptándola a su estado del día.',
    'Escuchar al cuerpo. El usuario debe detener la actividad ante dolor en el pecho, mareo, falta de aire anormal, dolor articular o cualquier síntoma inusual, buscar atención médica y avisar a su coach.',
    'Entorno. El usuario es responsable de las condiciones en que entrena (tráfico, clima, altitud, superficie, equipo, hidratación).',
    'Contenido generado por IA. Cuando un plan haya sido generado o ajustado con IA, se indicará. Puede contener errores y debe usarse con criterio.',
    `Limitación de responsabilidad. En la máxima medida permitida por la ley peruana, ${OWNER} no será responsable por lesiones, daños o perjuicios derivados de la ejecución de los planes de entrenamiento, del incumplimiento de las indicaciones de este aviso, de información de salud falsa u omitida por el usuario, o de decisiones tomadas por el usuario sobre su entrenamiento. Esta limitación no aplica a los supuestos de dolo o culpa inexcusable.`,
  ],
};

export const TERMS: LegalSection = {
  title: 'Términos y Condiciones de Uso',
  items: [
    `Titular: ${OWNER}, con RUC [N.º], domicilio en [dirección], Perú.`,
    'Objeto: Train Please es una plataforma web privada que permite a coaches crear planes de entrenamiento individuales y a atletas consultarlos y registrar su progreso y sensaciones.',
    'Acceso: solo para usuarios mayores de 18 años registrados por un administrador, mediante cuenta de Google. El usuario es responsable de la seguridad de su cuenta y de la veracidad de sus datos.',
    'Obligaciones: brindar información veraz, en especial sobre salud, lesiones y limitaciones; comunicar al coach cualquier cambio; no compartir la cuenta ni intentar acceder a datos de otros usuarios.',
    'Naturaleza de los planes: son recomendaciones deportivas generales adaptadas con la información del usuario. Su ejecución es decisión libre del usuario, quien asume los riesgos inherentes. No se garantizan resultados deportivos. Se aplica el Aviso de responsabilidad. Nada en estos términos excluye la responsabilidad que por ley no pueda excluirse.',
    'Servicios complementarios: los planes de pago pueden incluir servicios presenciales sujetos a disponibilidad y a las condiciones del plan; pueden ser prestados por terceros profesionales, quienes responden por su propio servicio.',
    'Planes gratuitos y de pago: los usuarios piloto acceden gratis por el periodo comunicado. Las condiciones de los planes de pago se informarán antes de contratar, conforme al Código de Protección y Defensa del Consumidor.',
    'Propiedad intelectual: el software, la marca y los planes son de su titular. Los comentarios y registros del usuario son suyos; nos autoriza a usarlos para prestar el servicio.',
    'Baja: el usuario puede solicitar la baja en cualquier momento. Si los términos cambian de forma relevante, se pedirá una nueva aceptación.',
    'Ley aplicable: leyes de la República del Perú, sin perjuicio del derecho del consumidor de acudir al INDECOPI.',
  ],
};

export const PRIVACY: LegalSection = {
  title: 'Política de Datos Personales',
  items: [
    `Responsable: ${OWNER}. Banco de datos "Atletas" (inscripción ante la ANPD pendiente). Ley N.º 29733 y su Reglamento (D.S. N.º 016-2024-JUS).`,
    'Datos que tratamos: identificación y contacto (nombre, correo de Google, foto); deportivos (nivel, objetivos, carreras, disponibilidad, equipo, sesiones realizadas, comentarios y esfuerzo percibido); y datos sensibles de salud que declares (lesiones, limitaciones, condiciones médicas).',
    'Finalidades necesarias: crear y ajustar tu plan, permitir que tu coach vea tu cumplimiento y comentarios, y gestionar tu cuenta. Finalidades adicionales y opcionales: IA con revisión del coach, novedades y estadísticas anonimizadas.',
    'Transferencia internacional: tus datos se almacenan con Google LLC (Firebase) y Vercel Inc., con servidores fuera del Perú. No vendemos tus datos.',
    'Conservación: mientras tengas cuenta activa. Tras la baja o la revocación, eliminamos o anonimizamos tus datos en un plazo máximo de [30] días, salvo obligación legal.',
    'Derechos: acceso, rectificación, cancelación y oposición (ARCO) y revocación del consentimiento, sin costo y sin justificarlo.',
    `Cómo revocar: desde Ajustes > Privacidad > Revocar consentimiento (un clic y una confirmación; tu coach deja de ver tus registros al instante) o escribiendo a ${PRIVACY_EMAIL}. Puedes revocar solo las finalidades adicionales y seguir usando la app. La revocación no afecta el tratamiento realizado antes.`,
    'Si consideras que no atendimos tu solicitud, puedes reclamar ante la Autoridad Nacional de Protección de Datos Personales.',
  ],
};
