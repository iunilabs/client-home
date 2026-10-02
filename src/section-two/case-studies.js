// Editorial summaries based on Puntoes services and its public client list.
// https://www.puntoes.es/ · /formacion/ · /consultoria/
// BBVA: https://www.puntoes.es/bbva-customer-solutions/
// Sabadell: collaboration and start date supplied by the user; no project names.
// Other clients: general editorial wording, without attributing specific projects.
export const caseStudies = {
  sabadell: {
    cardTitle: 'Construimos banca digital.',
    cardIntro: 'Arquitectura front-end desde diciembre de 2025.'
  },
  accenture: {
    cardTitle: 'Del saber al hacer.',
    cardIntro: 'Talento y tecnología para seguir avanzando.'
  },
  bbva: {
    cardTitle: 'Desde 2009, juntos.',
    cardIntro: 'Tecnología y personas al servicio del cliente.'
  },
  canal: {
    cardTitle: 'Cuidar lo esencial.',
    cardIntro: 'Conocimiento para un servicio que nos une.'
  },
  cepsa: {
    cardTitle: 'Energía para avanzar.',
    cardIntro: 'Personas y tecnología ante nuevos retos.'
  },
  mapfre: {
    cardTitle: 'Confianza para crecer.',
    cardIntro: 'Aprendizaje que acompaña el cambio.'
  },
  mediaset: {
    cardTitle: 'Ideas que conectan.',
    cardIntro: 'Talento y tecnología para seguir creando.'
  },
  ree: {
    cardTitle: 'Conectar el futuro.',
    cardIntro: 'Conocimiento para afrontar nuevos retos.'
  },
  siemens: {
    cardTitle: 'Del potencial a la práctica.',
    cardIntro: 'Tecnología que se convierte en aprendizaje.'
  },
  naturgy: {
    cardTitle: 'El cambio empieza aquí.',
    cardIntro: 'Talento y tecnología para avanzar juntos.'
  },
  telefonica: {
    cardTitle: 'Conectar para avanzar.',
    cardIntro: 'Talento y tecnología que acercan personas.'
  },
  indra: {
    cardTitle: 'Ideas que se transforman.',
    cardIntro: 'Conocimiento para afrontar nuevos retos.'
  },
  allianz: {
    cardTitle: 'Confianza para avanzar.',
    cardIntro: 'Aprendizaje que acompaña el cambio.'
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
