// Add a quarter of the accepted map on every edge. The original district
// occupies the centred two thirds; buildings and roof points keep their scale.
export const CITY_MARGIN = .25;
export const CITY_EXTENT = 1 + 2 * CITY_MARGIN;
export const CITY_CORE_OFFSET = CITY_MARGIN / CITY_EXTENT;

export function cityExtent({width, height, originX, originY}) {
  return {width: width * CITY_EXTENT, height: height * CITY_EXTENT,
    coreWidth: width, coreHeight: height, coreLeft: width * CITY_MARGIN, coreTop: height * CITY_MARGIN,
    originX: (originX + CITY_MARGIN) / CITY_EXTENT,
    originY: (originY + CITY_MARGIN) / CITY_EXTENT};
}
