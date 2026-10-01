// EDIT THIS LIST to select and order the mobile itinerary.
// Accepted mobile itinerary: three companies plus the construction invitation.
// All ten companies remain available through the logo footer, independently.
// 'collaborate' is the optional construction-site invitation.
export const mobileTourOrder = ['bbva', 'naturgy', 'sabadell', 'collaborate'];

// Camera calibration, in percentages of the portrait artwork.
export const mobileTourBuildings = {
  canal: {center: [23.911, 22.548], size: [7.864, 7.656], pin: [23.911, 18.84]},
  bbva: {center: [50, 19.049], size: [10.308, 8.911], pin: [50.053, 14.713]},
  cepsa: {center: [76.939, 20.185], size: [8.289, 9.988], pin: [76.939, 15.311]},
  mapfre: {center: [86.451, 32.117], size: [17.322, 9.091], pin: [86.291, 27.871]},
  ree: {center: [82.625, 50.748], size: [19.872, 9.031], pin: [82.784, 47.368]},
  siemens: {center: [79.224, 65.161], size: [29.012, 12.022], pin: [74.708, 59.988]},
  naturgy: {center: [46.44, 61.274], size: [14.028, 10.108], pin: [46.44, 56.459]},
  sabadell: {center: [22.529, 72.368], size: [16.578, 10.407], pin: [23.061, 68.301]},
  mediaset: {center: [21.838, 50.568], size: [18.385, 14.175], pin: [20.191, 43.84]},
  accenture: {center: [20.191, 33.553], size: [21.467, 8.493], pin: [22.742, 30.801]},
  collaborate: {center: [11.583, 9.809], size: [14.665, 8.852], pin: [10.733, 8.911]},
};

export const mobileTourRoute = mobileTourOrder.map(id => ({id, ...mobileTourBuildings[id]}));

export const mobileTourHub = {id: 'puntoes', center: [52.657, 40.879], size: [19.235, 6.758]};

// Distances are viewport heights; changing the list adjusts the section length.
export const mobileTourTiming = {intro: .8, stop: 1.45, outro: .25,
  travelUntil: .42, cardFrom: .04, cardUntil: .48,
  // Logo visits use milliseconds, independently of scrolling speed.
  logoTravel: 1250, logoCardFrom: 80, logoCardUntil: 650};
