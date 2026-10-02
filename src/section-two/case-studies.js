// Editorial summaries based on Puntoes services and its public client list.
// https://www.puntoes.es/ · /formacion/ · /consultoria/
// BBVA: https://www.puntoes.es/bbva-customer-solutions/
// Sabadell: collaboration and start date supplied by the user; no project names.
// Other clients: general editorial wording, without attributing specific projects.
export const caseStudies = {
  sabadell: {
    cardTitle: 'Construimos banca digital.',
    cardIntro: 'Front-end desde diciembre de 2025.'
  },
  accenture: {
    cardTitle: 'Del conocimiento a la práctica.',
    cardIntro: 'Aprender, aplicar y compartir tecnología.'
  },
  bbva: {
    cardTitle: 'Desde 2009, juntos.',
    cardIntro: 'Apoyo a la gestión de clientes del banco.'
  },
  canal: {
    cardTitle: 'Conocimiento que sostiene.',
    cardIntro: 'Personas preparadas para lo esencial.'
  },
  cepsa: {
    cardTitle: 'Prepararse para el cambio.',
    cardIntro: 'Nuevas capacidades para nuevos retos.'
  },
  mapfre: {
    cardTitle: 'El valor de estar preparados.',
    cardIntro: 'Aprendizaje para un sector que evoluciona.'
  },
  mediaset: {
    cardTitle: 'Tecnología detrás de las ideas.',
    cardIntro: 'Aprender al ritmo de nuevos formatos.'
  },
  ree: {
    cardTitle: 'Conocimiento en conexión.',
    cardIntro: 'Capacidades para un entorno exigente.'
  },
  siemens: {
    cardTitle: 'Entender. Aplicar. Avanzar.',
    cardIntro: 'Acercar la tecnología a las personas.'
  },
  naturgy: {
    cardTitle: 'Energía para aprender.',
    cardIntro: 'Preparar equipos para lo que viene.'
  },
  telefonica: {
    cardTitle: 'Conectar también es aprender.',
    cardIntro: 'Conocimiento que se comparte y crece.'
  },
  indra: {
    cardTitle: 'Talento ante la complejidad.',
    cardIntro: 'Aprender con nuevas tecnologías.'
  },
  allianz: {
    cardTitle: 'Prepararse genera confianza.',
    cardIntro: 'Criterio para afrontar nuevos escenarios.'
  },
};

export function getCaseStudy(id) {
  const story = caseStudies[id];
  if (!story) return null;
  return {...story, title: story.cardTitle, intro: story.cardIntro};
}

export const collaborationStory = {title: 'Tu próximo proyecto.',
  cardIntro: 'Cuéntanos qué quieres transformar.',
  intro: 'Cuéntanos qué quieres transformar.'};
