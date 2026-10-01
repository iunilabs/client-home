# Prompts exactos V14 — estudio de nitidez móvil

Herramienta integrada `image_gen`; sin CLI/API. V13 y cada recorte técnico se inspeccionaron con `view_image` antes de editar. No se alteraron los assets aprobados ni código.

## Máster completo mayor — descartado como solución de resolución

Entrada: `puntoes-city-mobile-master-v13-tour.png`, 941 × 1672. La petición de 2160 × 3840 produjo nuevamente 941 × 1672. Salida conservada solo como original del generador: `/Users/daviddavila/.codex/generated_images/01a0f467-7316-7563-bab6-d4fd09ed9786/exec-9d12a79d-44f6-48cc-927d-56b3df999b43.png`. No se seleccionó para integración.

```text
Use case: precise-object-edit
Asset type: higher-native-resolution master of an approved mobile miniature-city web illustration.
Input 1 is the sole EDIT TARGET: the approved V13 portrait image, native 941 × 1672. The task is increased TRUE generated detail and native pixel resolution only. Return a genuinely newly rendered 2160 × 3840 portrait master if supported; do not merely enlarge/interpolate the original. Do not add sharpening halos.
Composition lock: reproduce the exact same full image field, camera angle, isometric perspective, horizon-free crop, sunlight direction, colour palette, river, bridges, coast, rocks, sandy beaches, roads, houses, plazas, vegetation, cars and boats at the same normalized positions, sizes and silhouettes. No camera move, crop, outpainting, zoom or layout change.
Preserve all twelve distinctive landmarks exactly once at their existing normalized coordinates and scale: modest L-shaped two-storey Puntoes .es office in the centre; upper-left two-storey concrete construction site and crane; Accenture blue-glass and white office to the west; BBVA oval sail-shaped tower toward the upper centre; Canal brick cylindrical water tower with silver dome northwest; Cepsa slender silver portal-frame skyscraper northeast; SHORT MAPFRE dark horizontal-striped tower and pale pink base east; Mediaset glass office and red-white antenna southwest; Red Eléctrica curved glass office east below Puntoes; Siemens dark bronze angular U-shaped campus lower-right; Naturgy rounded blue-glass rectangular office lower centre; Banco Sabadell classical beige stone bank lower-left.
Detail improvement: faithfully resolve fine edges already implied in the source, window mullions, floor divisions, white concrete frames, brick courses, balcony rails, paving joins, road markings and roof equipment. Use the same restrained crisp videogame miniature render with all depths in focus. Keep every building's silhouette, façade structure, window rhythm and material identity. No new decorative details that change architecture.
Text: preserve only the existing tiny ".es" exactly as dot-e-s and the existing unobtrusive building sign marks; do not invent labels, visible client names, points, logos, controls, UI or text.
Constraints: no extra houses or trees, no saturation increase, haze, blur, depth of field, painted textures or invented features. Exact normalized geometry and framing matter more than decorative realism. Native 2160 × 3840 output requested, never advertise interpolated pixels as new detail.
```

## BBVA — primera prueba local revisada antes de extender la técnica

Recorte V13 exacto `[332,70,280,496]` en píxeles `[izquierda, arriba, ancho, alto]`. Salida nativa 942 × 1669.

```text
Use case: precise-object-edit
Asset type: experimental high-detail local texture for the BBVA stop in a mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an exact 280 × 496 pixel crop from the approved city illustration, not a new composition.
Primary request: faithfully re-render THIS ENTIRE CROP at high native resolution, ideally 1024 × 1824 or the largest supported portrait output, so this local part of the city contains genuinely rendered additional fine detail. Preserve the crop boundaries exactly. The blue oval sail-shaped BBVA building and its white curved rim must keep precisely their original position, proportions, tilt, footprint, floor count, horizontal stripes, window rhythm, taper and silhouette.
Composition: reproduce the exact same image field and isometric viewpoint, including every existing house, terrace, road, crossing, riverbank, bridge edge, tree, café canopy and shadow at the same normalized coordinates. The large blue oval tower remains centred horizontally with the same generous context and river to its left. This is not a tighter crop or a new camera view. Do not move or resize any object.
Detail: retain the original crisp miniature videogame render, materials, same natural restrained colours and sunlight. Resolve the existing glass/window mullions, white curved frame edges, tiny roof details, paving joints, riverbank stones, thin bridge railings and foliage with clean high-detail rendering. All depths in focus. New detail should be a careful reconstruction of what is already present, not a redesigned façade or more clutter.
Constraints: keep the complete same original crop content and no new objects. No extra buildings, trees, floors, vehicles, logos, text, labels, glowing blue markers, controls or user interface. No stronger saturation, dramatic light, blur, haze, painterly texture or sharpening halos. Exact geometry and registration to the source matters more than added decoration.
Deliver a native high-resolution image with the same approximately 280:496 aspect ratio. Do not deliver an interpolated enlargement of the source crop. This is one local BBVA trial; no other landmarks.
```

## puntoes

Recorte V13 exacto `[346,418,300,532]`. Referencia `v14-resolution-study/puntoes-source-crop-v13.png`. PNG nativo `v14-resolution-study/puntoes-detail-native-v14-trial.png`.

```text
Use case: precise-object-edit
Asset type: local high-detail texture trial for an approved mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an exact 300 × 532 pixel technical crop from the accepted V13 city. Preserve this ENTIRE crop field and its boundaries.
Primary request: faithfully re-render this same crop at the largest supported native portrait resolution, approximately 941 × 1672 or higher, with genuinely rendered additional fine detail. Do not merely interpolate the small source.
Subject lock: the modest cream two-storey L-shaped Puntoes office, flat landscaped roof, blue window frames and its small ".es" sign. Keep the exact L-shaped plan, height, courtyard and original sign location. Preserve the text ".es" exactly as dot-e-s; add no other lettering.
Composition lock: retain precisely the same normalized position, size and silhouette of every existing building, house, tree, road, crossing, plaza, riverbank, bridge edge, canopy and shadow. Keep the same isometric camera angle, perspective, crop, sun direction and calm natural colour palette. No camera move, tighter crop, outpainting, zoom or redesign.
Details: resolve existing façade mullions, stonework, paving joins, roof equipment, railings and foliage with crisp native detail. Keep the original miniature videogame 3D render and all depths in focus. Reconstruct only fine details implied by the source; never invent a different floor count, roof plan, façade bay structure or decorative architecture.
Constraints: no new objects, extra houses, vegetation, vehicles, landmarks, client labels, blue points, controls or UI. No extra text. Preserve original architectural identity and the full subject well inside the image. No saturation boost, blur, haze, depth of field, painterly textures or sharpening halos. Exact geometry and source registration take priority.
Deliver the same 300:532 portrait aspect ratio at native high resolution.
```

## naturgy

Recorte V13 exacto `[297,777,280,496]`. Referencia `v14-resolution-study/naturgy-source-crop-v13.png`. PNG nativo `v14-resolution-study/naturgy-detail-native-v14-trial.png`.

```text
Use case: precise-object-edit
Asset type: local high-detail texture trial for an approved mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an exact 280 × 496 pixel technical crop from the accepted V13 city. Preserve this ENTIRE crop field and its boundaries.
Primary request: faithfully re-render this same crop at the largest supported native portrait resolution, approximately 941 × 1672 or higher, with genuinely rendered additional fine detail. Do not merely interpolate the small source.
Subject lock: the rounded rectangular medium-height blue-glass Naturgy office, dark blue vertical mullions, horizontal floor divisions and curved corners, flat roof with its existing small roof structures and planting. Preserve its exact footprint, floor rhythm, rooftop equipment and façade structure.
Composition lock: retain precisely the same normalized position, size and silhouette of every existing building, house, tree, road, crossing, plaza, riverbank, canopy and shadow. Keep the same isometric camera angle, perspective, crop, sun direction and calm natural colour palette. No camera move, tighter crop, outpainting, zoom or redesign.
Details: resolve existing façade mullions, floor divisions, paving joins, roof equipment, railings and foliage with crisp native detail. Keep the original miniature videogame 3D render and all depths in focus. Reconstruct only fine details implied by the source; never invent a different floor count, roof plan, façade bay structure or decorative architecture.
Constraints: no new objects, extra houses, vegetation, vehicles, landmarks, client labels, logos, text, blue points, controls or UI. Preserve original architectural identity and the full subject well inside the image. No saturation boost, blur, haze, depth of field, painterly textures or sharpening halos. Exact geometry and source registration take priority.
Deliver the same 280:496 portrait aspect ratio at native high resolution.
```

## sabadell

Recorte V13 exacto `[72,962,280,496]`. Referencia `v14-resolution-study/sabadell-source-crop-v13.png`. PNG nativo `v14-resolution-study/sabadell-detail-native-v14-trial.png`.

```text
Use case: precise-object-edit
Asset type: local high-detail texture trial for an approved mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an exact 280 × 496 pixel technical crop from the accepted V13 city. Preserve this ENTIRE crop field and its boundaries.
Primary request: faithfully re-render this same crop at the largest supported native portrait resolution, approximately 941 × 1672 or higher, with genuinely rendered additional fine detail. Do not merely interpolate the small source.
Subject lock: the Banco Sabadell classical pale beige stone bank, stepped classical façade, central recessed blue windows, pale roof and raised parapets. Preserve the original façade bay count, stone columns/pilasters, height, cornices, plan and silhouette. Do not add signage.
Composition lock: retain precisely the same normalized position, size and silhouette of every existing building, house, tree, road, crossing, plaza, riverbank, canopy and shadow. Keep the same isometric camera angle, perspective, crop, sun direction and calm natural colour palette. No camera move, tighter crop, outpainting, zoom or redesign.
Details: resolve existing stone courses, cornice profiles, classical column edges, window frames, paving joins, roof equipment, railings and foliage with crisp native detail. Keep the original miniature videogame 3D render and all depths in focus. Reconstruct only fine details implied by the source; never invent a different floor count, roof plan, façade bay structure or decorative architecture.
Constraints: no new objects, extra houses, vegetation, vehicles, landmarks, client labels, logos, text, blue points, controls or UI. Preserve original architectural identity and the full subject well inside the image. No saturation boost, blur, haze, depth of field, painterly textures or sharpening halos. Exact geometry and source registration take priority.
Deliver the same 280:496 portrait aspect ratio at native high resolution.
```

## collaborate

Recorte V13 exacto `[0,0,252,448]`. Referencia `v14-resolution-study/collaborate-source-crop-v13.png`. PNG nativo `v14-resolution-study/collaborate-detail-native-v14-trial.png`.

```text
Use case: precise-object-edit
Asset type: local high-detail texture trial for an approved mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an exact 252 × 448 pixel technical crop from the accepted V13 city. Preserve this ENTIRE crop field and its boundaries.
Primary request: faithfully re-render this same crop at the largest supported native portrait resolution, approximately 941 × 1672 or higher, with genuinely rendered additional fine detail. Do not merely interpolate the small source.
Subject lock: the unfinished two-storey concrete office construction site and its yellow tower crane, including the COMPLETE crane mast, long jib, counterjib, top framework, cables and base. Keep precisely the original two-storey structural frame, slab positions, crane geometry and orientation. No extra floors, buildings, cranes or workers.
Composition lock: retain precisely the same normalized position, size and silhouette of every existing building, house, tree, park path, fountain, road, crossing, plaza, riverbank, canopy and shadow. Keep the SAME partial cylindrical water tower already visible at the lower-right edge, without changing the crop or completing it. Keep the same isometric camera angle, perspective, crop, sun direction and calm natural colour palette. No camera move, tighter crop, outpainting, zoom or redesign.
Details: resolve existing concrete beam edges, scaffolding, yellow crane lattice members and cables, paving joins, roof equipment, railings and foliage with crisp native detail. Keep the original miniature videogame 3D render and all depths in focus. Reconstruct only fine details implied by the source; never invent a different floor count, plan, crane structure or decorative architecture.
Constraints: keep the complete crane fully visible with the same original space around it. No new objects, extra houses, vegetation, vehicles, landmarks, client labels, logos, text, blue points, controls or UI. No saturation boost, blur, haze, depth of field, painterly textures or sharpening halos. Exact geometry and source registration take priority.
Deliver the same 252:448 portrait aspect ratio at native high resolution.
```
