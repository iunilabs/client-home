// Illustrative editorial copy requested for the prototype; these are not verified projects.
export const caseStudies = {
  sabadell: {
    title: 'Avanzar, sin perder la cercanía.',
    intro: 'Un itinerario de aprendizaje para conectar las posibilidades de la IA con el trabajo de quienes acompañan a cada cliente.',
    challenge: 'Acercar nuevas herramientas a los equipos, con ejemplos que tengan sentido en su día a día.',
    approach: 'Sesiones prácticas para organizar información, preparar comunicaciones y explorar asistentes, con criterio profesional y revisión humana.',
    goal: 'Más confianza al utilizar la tecnología. Más espacio para una relación cercana.'
  },
  accenture: {
    title: 'El conocimiento también se transforma.',
    intro: 'Un programa para que los equipos incorporen la IA a su trabajo diario, con criterio y autonomía.',
    challenge: 'Pasar de probar herramientas a saber cuándo, cómo y para qué utilizarlas.',
    approach: 'Talleres prácticos con situaciones de trabajo: investigar, sintetizar información y preparar entregables. Cada equipo construye su propia forma de trabajar con IA.',
    goal: 'Personas más autónomas. Un conocimiento que se comparte y permanece.'
  },
  bbva: {
    title: 'La tecnología, al servicio de la confianza.',
    intro: 'Una experiencia de aprendizaje que conecta la inteligencia artificial con la atención a las personas.',
    challenge: 'Encontrar tiempo para escuchar mejor, en un entorno lleno de información y tareas repetitivas.',
    approach: 'Formación sobre asistentes de IA, búsqueda de conocimiento y preparación de respuestas, con revisión humana y cuidado de los datos.',
    goal: 'Menos fricción en el trabajo. Más atención a cada conversación.'
  },
  canal: {
    title: 'Lo esencial también necesita nuevas ideas.',
    intro: 'Acercar la IA a los equipos que cuidan un recurso que todos compartimos.',
    challenge: 'Convertir información técnica dispersa en conocimiento útil para el día a día.',
    approach: 'Un itinerario práctico para consultar documentación, estructurar incidencias y compartir aprendizajes entre áreas.',
    goal: 'Conocimiento más accesible para las personas que sostienen un servicio esencial.'
  },
  cepsa: {
    title: 'La energía de aprender juntos.',
    intro: 'Un recorrido de formación para llevar la IA de la curiosidad a las decisiones cotidianas.',
    challenge: 'Conectar nuevas herramientas con procesos complejos, sin perder el criterio de los especialistas.',
    approach: 'Sesiones por perfiles y laboratorios de casos: análisis de documentación, preparación de informes y detección de oportunidades de mejora.',
    goal: 'Equipos que entienden la tecnología y saben dónde puede aportar valor.'
  },
  mapfre: {
    title: 'Cuidar mejor empieza por comprender mejor.',
    intro: 'Explorar cómo la IA puede liberar tiempo y mejorar el acceso al conocimiento de los equipos.',
    challenge: 'Trabajar con documentación extensa sin que la información se convierta en una barrera.',
    approach: 'Talleres para resumir documentos, localizar respuestas y preparar comunicaciones claras, con supervisión profesional.',
    goal: 'Más claridad para trabajar. Más tiempo para las personas.'
  },
  mediaset: {
    title: 'Nuevas herramientas. La misma mirada.',
    intro: 'Un espacio para explorar la IA sin renunciar a la creatividad ni a la voz propia.',
    challenge: 'Integrar nuevas posibilidades en un trabajo que depende del criterio editorial y de las ideas.',
    approach: 'Laboratorios creativos para investigar, desarrollar propuestas y organizar materiales. La IA acompaña; las decisiones siguen en manos del equipo.',
    goal: 'Más espacio para crear, con una mirada que sigue siendo humana.'
  },
  ree: {
    title: 'Conectar conocimiento, conectar futuro.',
    intro: 'Poner la IA al alcance de los equipos técnicos, desde sus preguntas y su experiencia.',
    challenge: 'Hacer más accesible el conocimiento de una organización especializada.',
    approach: 'Formación aplicada a la consulta documental, la síntesis de información y el intercambio de aprendizajes, con atención a la trazabilidad.',
    goal: 'La experiencia de las personas, conectada con nuevas formas de trabajar.'
  },
  siemens: {
    title: 'Del potencial a la práctica.',
    intro: 'Convertir las posibilidades de la IA en pequeños avances concretos para los equipos.',
    challenge: 'Encontrar usos relevantes en un entorno técnico, más allá de las demostraciones genéricas.',
    approach: 'Talleres con documentación, preparación de soluciones y comunicación técnica. Cada participante sale con un caso que puede seguir desarrollando.',
    goal: 'Aprendizaje que se convierte en práctica y una tecnología que se entiende.'
  },
  naturgy: {
    title: 'El cambio se mueve con las personas.',
    intro: 'Acompañar a los equipos en una adopción de la IA cercana, gradual y útil.',
    challenge: 'Dar confianza a personas con experiencias y niveles de conocimiento distintos.',
    approach: 'Un itinerario con sesiones de iniciación, ejercicios por área y espacios para compartir dudas y descubrimientos.',
    goal: 'Una transformación compartida, que empieza por comprender y continúa al hacer.'
  }
};

export function getCaseStudy(id) {
  const story = caseStudies[id];
  if (!story) return null;
  return {...story, status: 'illustrative'};
}
