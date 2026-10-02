# Nuevas sedes V17

Generación con image_gen integrado. Referencias arquitectónicas, no fotografías insertadas en la ciudad. Recortes locales para conservar edificios anteriores.

## Fuentes

- Telefónica: edificio histórico Gran Vía 28, Madrid. https://espacio.fundaciontelefonica.com/visitanos/el-edificio/ y https://www.fundaciontelefonica.com/noticias/17_01_2014_esp_6370-2846/ (reloj azul).
- Indra: sede social Av. Bruselas 35, Alcobendas. https://www.indragroup.com/es/informacion-legal y fotografías del arquitecto https://eas.es/proyectos/indra-sede-social/
- Allianz España: Ramírez de Arellano 35, Madrid. https://www.allianz.com/en/about-us/company/contact/spain.html y fotografía del consultor del edificio https://wssre.com/proyectos/ (Allianz RD35).

Son interpretaciones ilustradas de edificios reales; no planos ni reproducciones de precisión. La ciudad es una composición ficticia, no su ubicación geográfica.

## Prompts exactos

### allianz Desktop

```text
Use case: precise-object-edit. Image1 is exact edit target, close crop from desktop coastal-city map. Replace ONLY the central red-roof house at x55%,y63% with a recognizable miniature of Allianz Spain's Ramirez de Arellano 35 Madrid building shown in Image2 (actual photo) and3 (approved mobile design). Broad gently curved convex BLUE/teal glass facade with fine white rectangular mullion grid, six floors, white stone end walls with slit windows, light flat rooftop with a restrained small blue Allianz sign. Keep building entirely inside central plot, crop roof/ground visible and margin, about65% crop width. Preserve the villa at upper-left, grey-roof house at lower-left, all existing roads, trees, landscaping, top-edge office and image boundary pixels. Match original elevated isometric camera, sunny upper-left lighting and crisp realistic miniature/diorama rendering of Image1. Image3 only guides architecture, don't introduce its beach or change original surrounding geography. No skyscraper, oval tower, extra office buildings or oversized signage. Output original crop composition/aspect in high native detail.
```

### telefonica Mobile

```text
Use case: precise-object-edit. Image1 is exact edit target: a close crop of a sunny miniature isometric coastal city, NOT an entire map. Replace ONLY the grey-roof white four-floor office in the UPPER LEFT half with a recognizable miniature of the historic Telefonica building at Gran Via 28 Madrid. Preserve its location, the bottom-right red-roof house, every street, trees, river and all crop edges. Image2 is architecture reference for the distinctive stone clock crown: pale warm limestone and granite, stepped 1920s high-rise silhouette, regular narrow rectangular windows, ornate Spanish neo-baroque entrance and cornices, square tower with small blue clock near the top and sculptural crest. About 12-14 stories, slender proportions, clearly taller than nearby houses but its roof AND ground-floor entrance must both fit entirely inside the image with margin. Match the original map's elevated isometric camera, lighting from upper left, warm sunlight, crisp polished miniature/diorama rendering and realistic materials. No photo backgrounds, no skyscraper of blue glass, no large lettering or extra buildings. Keep exact crop composition/aspect ratio; generate genuinely detailed high-resolution artwork suitable for zoom, not blurry enlargement.
```

### telefonica Desktop

```text
Use case: precise-object-edit. Image1 is exact edit target, close square-ish crop of existing desktop miniature coastal-city map. Replace ONLY the central red-roof house approximately at x46%,y65% with the same historic Telefonica Gran Via 28 miniature as Image2, which is the approved mobile building style reference. Preserve every road, house near lower-left, trees and exact crop margins/perspective of Image1. Pale warm stone neo-baroque stepped high-rise, about 12 stories, narrow regular window grid, ornate entrance, tiered central clock crown with small blue clock and crest. Slender footprint; whole tower must fit within crop from y15% to y80% with roof and entrance visible, no touching neighboring buildings. Match Image1's original elevated isometric camera/scale and warm upper-left sunlight; use Image2 only for faithful building architecture, not its background layout. Crisp realistic sunny architectural diorama. No blue glass tower, no giant lettering, no other landmark changes. Keep original crop aspect/composition and generate detailed high resolution.
```

### indra Mobile

```text
Use case: precise-object-edit. Image1 is the edit target, exact cropped sunny miniature isometric city. Replace ONLY the large red-roof cream house ABOVE the central crossroads with a miniature of the actual Indra headquarters in Alcobendas (Avenida Bruselas 35), photographed in Image2. Low broad complex of offset rectangular office wings, about 4-5 stories, glossy blue-grey/green glass, horizontal silver bands, continuous external metal railings, flat dark roofs with shallow rooftop louvres, connected staggered volumes surrounding a planted court, discreet white Indra lettering on one facade. NOT a tower. Keep entire headquarters inside upper two-thirds of crop, with all top/side margins, replacing that one block and immediate lawn only. The bottom red-roof house, large crossroads, roads, surrounding trees and rightmost blue building must stay exactly unchanged. Elevated isometric camera and polished realistic miniature/diorama style matching Image1, warm sunlight from upper left, believable windows and fine details. No photoreal street-view backdrop, no oversized logo or new extra landmarks. Output same crop aspect/composition in genuinely detailed high resolution for mobile zoom.
```

### indra Desktop

```text
Use case: precise-object-edit. Image1 is the exact edit target: close crop from existing desktop coastal city map. Replace ONLY the central red-roof white villa at x50%,y50% with a recognizable miniature of Indra's Alcobendas HQ shown in Images2 (real facade) and3 (approved mobile miniature). Compact LOW office campus of staggered rectangular wings 4-5 stories, reflective blue-grey glass with thin silver horizontal bands and delicate metal balcony rails, flat dark roofs with small rooftop louvres, planted central court, small restrained Indra facade lettering. Campus entirely inside the central plot and crop margins, width about65%, height50%, do not touch the top-right villa or bottom-edge blue curved office. Keep ALL existing streets, paths, trees, neighboring buildings and crop boundary pixels precisely as Image1. Match its elevated isometric camera, sunny upper-left lighting and realistic polished tiny architectural diorama style; approved mobile image is architecture reference only, do not borrow its background. No tower, no huge signage, no extra offices. Preserve original crop aspect ratio/composition; high native detail.
```

### allianz Mobile

```text
Use case: precise-object-edit. Image1 is exact edit target: close crop of sunny miniature isometric coastal city. Replace ONLY the central grey-roof white house ABOVE the seaside palm-lined boulevard with a miniature of Allianz Spain's Madrid office at Ramirez de Arellano 35 shown in Image2. Faithful recognizable architecture: broad gently convex curved facade of dark blue/teal reflective glass, fine regular rectangular white mullion grid, about 6 stories, white stone solid end-walls with narrow horizontal windows, broad light white cornice/flat rooftop, subtle small Allianz roof sign. This is a mid-rise curved office, NOT a tower, NOT an oval BBVA building. Keep the new building wholly inside image margins and planted plot above boulevard, about 60% of crop width. Preserve all existing roads, palms, canal on right, beach, houses at edges and crop boundary pixels. Match Image1's elevated isometric perspective, warm sunshine from upper left, realistic polished tiny architectural diorama materials and detail. No photographic backdrop or extra office buildings. Generate high native resolution for zoom with same crop composition and aspect ratio.
```
