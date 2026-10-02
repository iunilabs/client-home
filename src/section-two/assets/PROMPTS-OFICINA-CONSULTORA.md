# Oficina Puntoes · consultora tecnológica

2 de octubre de 2026. Edición localizada con la herramienta integrada `image_gen`. Se inspeccionaron los cuatro objetivos antes de editarse. La salida del detalle guía la fachada de los otros tres mapas. Los originales PNG se conservan en `docs/office-consultancy/masters/`, fuera de runtime. Solo se convierte formato a WebP Q98 (mapas) y Q92 (detalle); sin recorte, ampliación, collage, transformación ni pintura mediante código.

Se mantiene la oficina pequeña de dos plantas, su L, posición y terrazas. La nueva fachada utiliza marcos claros, acristalamiento de oficinas y entrada peatonal. Los demás clientes mantienen sus posiciones; el registro medido da 0 px en ambas fuentes desktop y hasta 1 px en móvil. La comparación y registro local están en `docs/office-consultancy/qa/`.

## Detalle móvil

```text
Use case: precise-object-edit.
Asset type: existing local mobile website city-map detail tile.
Input image 1 is the EDIT TARGET: this exact portrait miniature-city detail, 941×1670, featuring the central modest beige two-storey L-shaped Puntoes office with blue ".es" letters.
Change ONLY that Puntoes office's architecture and façade so it unmistakably looks like a small modern technology consultancy, welcoming and professional. Keep the EXACT current L-shaped footprint, exactly two floors, overall size, roof height, base position, camera perspective, and paved courtyard. Replace the chunky beige commercial/garage-like front with pale warm-white slim frames, generous blue-grey glazed office windows, an elegant small recessed glazed pedestrian entrance, and fine vertical facade detailing. Through a few windows show subtle desks and monitors as tiny natural office details; no giant screens. Keep the roof terrace calm with the same planted small trees and planters. Preserve a small accurate blue ".es" sign, spelled dot-e-s, on the right/front wing, clean and restrained.
Absolutely no garage doors, workshop bays, industrial warehouse, loading dock, factory equipment or car dealership.
Crucial invariants: do not change or move ANY other image content: every surrounding house, pavement, tree, car, palm, road, crosswalk, bridge, riverbank, river, lighting, shadow, horizon or crop. Do not zoom, crop, rotate or reframe. All content outside the small office must remain visually identical. Same warm daytime detailed isometric 3D videogame diorama, natural colours and sharp rendering; modest consultancy, not a tower or huge tech campus. Preserve full portrait aspect and native quality.
```

## Mapa móvil

```text
Use case: precise-object-edit with architecture reference.
Asset type: existing miniature city website map.
Input image 1 is the EDIT TARGET. Input image 2 is an ARCHITECTURAL REFERENCE only: the same Puntoes office already successfully redesigned as a small technology consultancy. Do not paste the whole reference tile into image 1.
Image 1 is portrait 941×1672. The Puntoes office is the small beige L-shaped two-storey building around x=43%..62% and y=37.5%..44%, just below the central river, with the existing tiny blue .es sign. Only edit that building in that exact local rectangle. Keep its footprint and roof silhouette registered exactly with image 1.
Change only this Puntoes office to match the architecture in image 2: modest L-shaped two-floor building with planted flat roof terraces, pale warm-white slim frames, generous blue-grey glazed OFFICE windows on both floors, fine vertical facade detailing, small elegant recessed glazed pedestrian entrance in the courtyard, subtle desks and monitors behind a few windows, and a tiny accurate blue ".es" sign on the right/front wing. Reduce all details appropriately to the original building's exact image scale; do not enlarge or reposition the building. It must clearly read as a small technology consultancy, not a workshop.
Change only the surfaces of the existing office. Keep its exact roof plan, overall width/height, footprint, courtyard and ground position. Preserve every other building and client landmark, house, tree, palm, car, road, path, river, bridge, beach, ocean and shadow at identical coordinates. Preserve all client landmark shapes. Do not duplicate or remove any landmark.
The image must remain the exact same city composition, camera, isometric aerial 3D videogame miniature style, natural colours, warm lighting and crisp quality. No zoom, crop, rotation, reframe, shift, outpainting, blur, haze or layout changes. Full portrait 941:1672 aspect, match original native size.
No garage doors, loading bays, workshop equipment, industrial warehouse, enormous technology campus, additional signs, logos, UI, text or labels. The only small text remains ".es", dot-e-s, on the office.
CRUCIAL: preserve every pixel's geography and composition outside the tiny specified office. Use the second image only to guide the office facade replacement.
```

## Núcleo desktop

```text
Use case: precise-object-edit with architecture reference.
Asset type: existing miniature city website map.
Input image 1 is the EDIT TARGET. Input image 2 is an ARCHITECTURAL REFERENCE only: the same Puntoes office already successfully redesigned as a small technology consultancy. Do not paste the whole reference tile into image 1.
Image 1 is landscape 1672×941. The Puntoes office is the modest beige two-storey L-shaped building around x=45.5%..57.5%, y=33.5%..47.0%, near the center of the map. Only edit that office. Keep its footprint, roof silhouette and base registered exactly with image 1.
Change only this Puntoes office to match the architecture in image 2: modest L-shaped two-floor building with planted flat roof terraces, pale warm-white slim frames, generous blue-grey glazed OFFICE windows on both floors, fine vertical facade detailing, small elegant recessed glazed pedestrian entrance in the courtyard, subtle desks and monitors behind a few windows, and a tiny accurate blue ".es" sign on the right/front wing. Reduce all details appropriately to the original building's exact image scale; do not enlarge or reposition the building. It must clearly read as a small technology consultancy, not a workshop.
Change only the surfaces of the existing office. Keep its exact roof plan, overall width/height, footprint, courtyard and ground position. Preserve every other building and client landmark, house, tree, palm, car, road, path, river, bridge, beach, ocean and shadow at identical coordinates. Preserve all client landmark shapes. Do not duplicate or remove any landmark.
The image must remain the exact same city composition, camera, isometric aerial 3D videogame miniature style, natural colours, warm lighting and crisp quality. No zoom, crop, rotation, reframe, shift, outpainting, blur, haze or layout changes. Full landscape 1672:941 aspect, match original native size.
No garage doors, loading bays, workshop equipment, industrial warehouse, enormous technology campus, additional signs, logos, UI, text or labels. The only small text remains ".es", dot-e-s, on the office.
CRUCIAL: preserve every pixel's geography and composition outside the tiny specified office. Use the second image only to guide the office facade replacement.
```

## Extensión desktop

```text
Use case: precise-object-edit with architecture reference.
Asset type: existing miniature city website map.
Input image 1 is the EDIT TARGET. Input image 2 is an ARCHITECTURAL REFERENCE only: the same Puntoes office already successfully redesigned as a small technology consultancy. Do not paste the whole reference tile into image 1.
Image 1 is landscape 1672×941. The Puntoes office is the small beige two-storey L-shaped building around x=46.8%..55.3%, y=39.0%..47.5%, in the center of the map. Only edit that office. Preserve the extended canvas, its original map registration, and exact architecture positions.
Change only this Puntoes office to match the architecture in image 2: modest L-shaped two-floor building with planted flat roof terraces, pale warm-white slim frames, generous blue-grey glazed OFFICE windows on both floors, fine vertical facade detailing, small elegant recessed glazed pedestrian entrance in the courtyard, subtle desks and monitors behind a few windows, and a tiny accurate blue ".es" sign on the right/front wing. Reduce all details appropriately to the original building's exact image scale; do not enlarge or reposition the building. It must clearly read as a small technology consultancy, not a workshop.
Change only the surfaces of the existing office. Keep its exact roof plan, overall width/height, footprint, courtyard and ground position. Preserve every other building and client landmark, house, tree, palm, car, road, path, river, bridge, beach, ocean and shadow at identical coordinates. Preserve all client landmark shapes. Do not duplicate or remove any landmark.
The image must remain the exact same city composition, camera, isometric aerial 3D videogame miniature style, natural colours, warm lighting and crisp quality. No zoom, crop, rotation, reframe, shift, outpainting, blur, haze or layout changes. Full landscape 1672:941 aspect, match original native size.
No garage doors, loading bays, workshop equipment, industrial warehouse, enormous technology campus, additional signs, logos, UI, text or labels. The only small text remains ".es", dot-e-s, on the office.
CRUCIAL: preserve every pixel's geography and composition outside the tiny specified office. Use the second image only to guide the office facade replacement.
```


## Continuidad de la oficina móvil

La revisión posterior conserva los archivos generados y sus hashes. La oficina móvil utiliza el mismo tile Puntoes desde el primer frame visible del mapa y durante todo el zoom, preparado y decodificado antes de revelar la sección. Su opacidad es siempre 1; la máscara de los bordes continúa integrando su contexto con V13. El mapa V13 sirve de respaldo fijo si la descarga o decodificación falla. Las once capas restantes mantienen su carga por visita y sus fundidos; escritorio no solicita estos tiles. No se realiza una generación independiente del mapa ni del detalle.
