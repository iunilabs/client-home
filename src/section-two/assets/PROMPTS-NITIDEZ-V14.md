# Prompts exactos V14 — estudio de nitidez móvil

Herramienta integrada `image_gen`; sin CLI/API. V13 y cada recorte técnico se inspeccionaron con `view_image` antes de editar. Las cinco texturas aprobadas se conservan byte a byte. V2 amplía únicamente el controlador de detalle, sus recursos y las pruebas dedicadas.

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

## V2 cobertura completa — 2 de octubre de 2026

Herramienta integrada `image_gen`, sin CLI/API, sin interpolación, pintura o warp de los activos. Se inspeccionaron V13, los doce recortes y las salidas nativas. Cada PNG seleccionado se copió intacto a `docs/city-detail-v2/masters/` (local, ignorado por Git). WebP calidad 92, método 6, codificado directamente con Pillow/libwebp; sin redimensionar. Los cinco WebP anteriores permanecen intactos.

Los recortes nuevos concentran más píxeles reales en el edificio completo y mantienen contexto para bordes suaves. Sus máscaras dejan el edificio calibrado dentro de la zona opaca; porcentajes y coordenadas en provenance. No se solicitaron doce imágenes al iniciar ni en escritorio.

### V2 cobertura completa — canal

Entrada 1 (edit target): `docs/city-detail-v2/source/canal-source-crop-v13.png`, rectángulo exacto V13 `[155, 257, 140, 240]`. Salida nativa seleccionada 958 × 1642; original `/Users/daviddavila/.codex/generated_images/01a0fb25-8161-75d0-83ea-fd700d4f7f0f/exec-b5a7adf3-4f8b-4107-8bc4-8b16f950e138.png`.

```text
Use case: precise-object-edit
Asset type: native high-detail local texture for the canal stop in the accepted mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an EXACT 140 × 240 source-pixel technical crop [155,257,140,240] of approved V13. Reconstruct THIS ENTIRE IMAGE FIELD with the same boundaries and aspect ratio 140:240.
Primary request: re-render the crop at high native resolution, ideally 2048 × 3511 pixels or the largest supported native resolution. This must contain genuinely newly rendered fine detail, not interpolation or sharpening of the small source. Preserve normalized coordinates exactly.
Subject lock: the brick cylindrical water tower with silver domed roof and its little top finial. Preserve the EXACT cylinder diameter, dome curve, existing arched windows, brick courses, floor rhythm, base door, rooftop finial and silhouette.
Composition lock: keep every existing building, house, tree, road, crossing, riverbank, bridge, beach, rock, vehicle, boat, canopy and shadow at precisely its original normalized position and size. Keep all existing partially cut neighboring landmarks PARTIAL at the same boundaries. Preserve original isometric camera, sun direction, natural restrained palette and crisp miniature videogame 3D rendering. All depths in focus.
Detail improvement only: resolve existing fine mullions, roof edges/equipment, brick courses, paving joins and railings with crisp newly rendered native detail. No change in architecture, object count or layout. Every building MUST retain its silhouette, roof plan and floor count. Subject geometry and exact registration are higher priorities than decorative realism.
Text: preserve existing tiny marks as already present; add NO new logos, words, letters or labels.
Avoid: camera movement, rotation, crop, outpainting, tighter zoom, new trees/houses/vehicles/objects, taller towers, extra floors, invented facade bays, dramatic lighting, saturation boosts, haze, depth-of-field blur, painterly texture, sharpening halos, UI, markers or watermarks.
Deliver one high-native-resolution image with the exact whole-crop composition.
```

### V2 cobertura completa — cepsa

Entrada 1 (edit target): `docs/city-detail-v2/source/cepsa-source-crop-v13.png`, rectángulo exacto V13 `[654, 218, 140, 240]`. Salida nativa seleccionada 958 × 1642; original `/Users/daviddavila/.codex/generated_images/01a0fb25-8161-75d0-83ea-fd700d4f7f0f/exec-fb3c3794-c5c1-49b4-99a2-1abd83417430.png`.

```text
Use case: precise-object-edit
Asset type: native high-detail local texture for the cepsa stop in the accepted mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an EXACT 140 × 240 source-pixel technical crop [654,218,140,240] of approved V13. Reconstruct THIS ENTIRE IMAGE FIELD with the same boundaries and aspect ratio 140:240.
Primary request: re-render the crop at high native resolution, ideally 2048 × 3511 pixels or the largest supported native resolution. This must contain genuinely newly rendered fine detail, not interpolation or sharpening of the small source. Preserve normalized coordinates exactly.
Subject lock: the slender silver-white rectangular PORTAL FRAME skyscraper containing its existing separate blue glass blocks and voids. Preserve the exact outer frame, top rectangular opening, three main existing blocks, visible gaps, base entrance, floor divisions and height. Do not fill its voids or redesign the frame.
Composition lock: keep every existing building, house, tree, road, crossing, riverbank, bridge, beach, rock, vehicle, boat, canopy and shadow at precisely its original normalized position and size. Keep all existing partially cut neighboring landmarks PARTIAL at the same boundaries. Preserve original isometric camera, sun direction, natural restrained palette and crisp miniature videogame 3D rendering. All depths in focus.
Detail improvement only: resolve existing fine mullions, roof edges/equipment, brick courses, paving joins and railings with crisp newly rendered native detail. No change in architecture, object count or layout. Every building MUST retain its silhouette, roof plan and floor count. Subject geometry and exact registration are higher priorities than decorative realism.
Text: preserve existing tiny marks as already present; add NO new logos, words, letters or labels.
Avoid: camera movement, rotation, crop, outpainting, tighter zoom, new trees/houses/vehicles/objects, taller towers, extra floors, invented facade bays, dramatic lighting, saturation boosts, haze, depth-of-field blur, painterly texture, sharpening halos, UI, markers or watermarks.
Deliver one high-native-resolution image with the exact whole-crop composition.
```

### V2 cobertura completa — mapfre

Entrada 1 (edit target): `docs/city-detail-v2/source/mapfre-source-crop-v13.png`, rectángulo exacto V13 `[711, 437, 220, 200]`. Salida nativa seleccionada 1315 × 1196; original `/Users/daviddavila/.codex/generated_images/01a0fb25-8161-75d0-83ea-fd700d4f7f0f/exec-90ffd4db-f2ac-4e0a-8d52-9b5709a8352b.png`.

```text
Use case: precise-object-edit
Asset type: native high-detail local texture for the mapfre stop in the accepted mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an EXACT 220 × 200 source-pixel technical crop [711,437,220,200] of approved V13. Reconstruct THIS ENTIRE IMAGE FIELD with the same boundaries and aspect ratio 220:200.
Primary request: re-render the crop at high native resolution, ideally 2048 × 1862 pixels or the largest supported native resolution. This must contain genuinely newly rendered fine detail, not interpolation or sharpening of the small source. Preserve normalized coordinates exactly.
Subject lock: the SHORT dark blue horizontal-striped rectangular tower, existing roof and its two pale pink low side wings with their small ROUND CIRCULAR black porthole window pattern. Preserve original height, width, proportions, plan, step heights, wing geometry, floor count and rooftop mast. Never increase the tower height.
Composition lock: keep every existing building, house, tree, road, crossing, riverbank, bridge, beach, rock, vehicle, boat, canopy and shadow at precisely its original normalized position and size. Keep all existing partially cut neighboring landmarks PARTIAL at the same boundaries. Preserve original isometric camera, sun direction, natural restrained palette and crisp miniature videogame 3D rendering. All depths in focus.
Detail improvement only: resolve existing fine mullions, roof edges/equipment, brick courses, paving joins and railings with crisp newly rendered native detail. No change in architecture, object count or layout. Every building MUST retain its silhouette, roof plan and floor count. Subject geometry and exact registration are higher priorities than decorative realism.
Text: preserve existing tiny marks as already present; add NO new logos, words, letters or labels.
Avoid: camera movement, rotation, crop, outpainting, tighter zoom, new trees/houses/vehicles/objects, taller towers, extra floors, invented facade bays, dramatic lighting, saturation boosts, haze, depth-of-field blur, painterly texture, sharpening halos, UI, markers or watermarks.
Deliver one high-native-resolution image with the exact whole-crop composition.
Critical correction from earlier trials: the pale pink wings have ROUND circular black porthole holes, never square. Reconstruct the exact circular shapes, same positions, count and size from THIS SOURCE image. Do not expand the composition horizontally: preserve all x and y normalized coordinates and crop boundaries strictly. Tower, wing outlines, roof corners, mast and neighboring objects must register exactly to the source. No lateral expansion or horizontal scale change. Source geometry takes absolute priority.
```

### V2 cobertura completa — ree

Entrada 1 (edit target): `docs/city-detail-v2/source/ree-source-crop-v13.png`, rectángulo exacto V13 `[637, 700, 280, 280]`. Salida nativa seleccionada 1254 × 1254; original `/Users/daviddavila/.codex/generated_images/01a0fb25-8161-75d0-83ea-fd700d4f7f0f/exec-926cee5a-821a-4f20-856c-a3732e82a035.png`.

```text
Use case: precise-object-edit
Asset type: native high-detail local texture for the ree stop in the accepted mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an EXACT 280 × 280 source-pixel technical crop [637,700,280,280] of approved V13. Reconstruct THIS ENTIRE IMAGE FIELD with the same boundaries and aspect ratio 280:280.
Primary request: re-render the crop at high native resolution, ideally 2048 × 2048 pixels or the largest supported native resolution. This must contain genuinely newly rendered fine detail, not interpolation or sharpening of the small source. Preserve normalized coordinates exactly.
Subject lock: the broad gently curved blue-glass office beside the river, with its white ribs, flat landscaped rooftop and existing pale rooftop equipment. Preserve the precise curve, footprint, complete ends, white ground-floor columns, floor count and glass grid.
Composition lock: keep every existing building, house, tree, road, crossing, riverbank, bridge, beach, rock, vehicle, boat, canopy and shadow at precisely its original normalized position and size. Keep all existing partially cut neighboring landmarks PARTIAL at the same boundaries. Preserve original isometric camera, sun direction, natural restrained palette and crisp miniature videogame 3D rendering. All depths in focus.
Detail improvement only: resolve existing fine mullions, roof edges/equipment, brick courses, paving joins and railings with crisp newly rendered native detail. No change in architecture, object count or layout. Every building MUST retain its silhouette, roof plan and floor count. Subject geometry and exact registration are higher priorities than decorative realism.
Text: preserve existing tiny marks as already present; add NO new logos, words, letters or labels.
Avoid: camera movement, rotation, crop, outpainting, tighter zoom, new trees/houses/vehicles/objects, taller towers, extra floors, invented facade bays, dramatic lighting, saturation boosts, haze, depth-of-field blur, painterly texture, sharpening halos, UI, markers or watermarks.
Deliver one high-native-resolution image with the exact whole-crop composition.
```

### V2 cobertura completa — siemens

Entrada 1 (edit target): `docs/city-detail-v2/source/siemens-source-crop-v13.png`, rectángulo exacto V13 `[568, 937, 360, 320]`. Salida nativa seleccionada 1330 × 1182; original `/Users/daviddavila/.codex/generated_images/01a0fb25-8161-75d0-83ea-fd700d4f7f0f/exec-5f1a760e-0e9a-4529-816e-c47b48ff2869.png`.

```text
Use case: precise-object-edit
Asset type: native high-detail local texture for the siemens stop in the accepted mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an EXACT 360 × 320 source-pixel technical crop [568,937,360,320] of approved V13. Reconstruct THIS ENTIRE IMAGE FIELD with the same boundaries and aspect ratio 360:320.
Primary request: re-render the crop at high native resolution, ideally 2048 × 1820 pixels or the largest supported native resolution. This must contain genuinely newly rendered fine detail, not interpolation or sharpening of the small source. Preserve normalized coordinates exactly.
Subject lock: the broad dark bronze/blue angular U-shaped office campus enclosing a planted courtyard, existing pale roof equipment and small red facade mark. Preserve the entire EXACT U-shaped plan, left/right wings, courtyard, height, rooftop layout, window bands and silhouette. Do not add signage or complete another shape.
Composition lock: keep every existing building, house, tree, road, crossing, riverbank, bridge, beach, rock, vehicle, boat, canopy and shadow at precisely its original normalized position and size. Keep all existing partially cut neighboring landmarks PARTIAL at the same boundaries. Preserve original isometric camera, sun direction, natural restrained palette and crisp miniature videogame 3D rendering. All depths in focus.
Detail improvement only: resolve existing fine mullions, roof edges/equipment, brick courses, paving joins and railings with crisp newly rendered native detail. No change in architecture, object count or layout. Every building MUST retain its silhouette, roof plan and floor count. Subject geometry and exact registration are higher priorities than decorative realism.
Text: preserve existing tiny marks as already present; add NO new logos, words, letters or labels.
Avoid: camera movement, rotation, crop, outpainting, tighter zoom, new trees/houses/vehicles/objects, taller towers, extra floors, invented facade bays, dramatic lighting, saturation boosts, haze, depth-of-field blur, painterly texture, sharpening halos, UI, markers or watermarks.
Deliver one high-native-resolution image with the exact whole-crop composition.
```

### V2 cobertura completa — mediaset

Entrada 1 (edit target): `docs/city-detail-v2/source/mediaset-source-crop-v13.png`, rectángulo exacto V13 `[73, 652, 280, 380]`. Salida nativa seleccionada 1076 × 1461; original `/Users/daviddavila/.codex/generated_images/01a0fb25-8161-75d0-83ea-fd700d4f7f0f/exec-b13173ba-60b4-4cd5-b79b-3168a1c20cfc.png`.

```text
Use case: precise-object-edit
Asset type: native high-detail local texture for the mediaset stop in the accepted mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an EXACT 280 × 380 source-pixel technical crop [73,652,280,380] of approved V13. Reconstruct THIS ENTIRE IMAGE FIELD with the same boundaries and aspect ratio 280:380.
Primary request: re-render the crop at high native resolution, ideally 2048 × 2779 pixels or the largest supported native resolution. This must contain genuinely newly rendered fine detail, not interpolation or sharpening of the small source. Preserve normalized coordinates exactly.
Subject lock: the rectangular blue-glass office with yellow horizontal bands and white end wall with round windows, and its COMPLETE red/white lattice communications antenna, little top stem, cables, base and white satellite dish. Preserve original antenna height, lattice, orientation, office footprint, roof, floor count, circular windows and façade layout. Do not omit or redesign antenna or dish.
Composition lock: keep every existing building, house, tree, road, crossing, riverbank, bridge, beach, rock, vehicle, boat, canopy and shadow at precisely its original normalized position and size. Keep all existing partially cut neighboring landmarks PARTIAL at the same boundaries. Preserve original isometric camera, sun direction, natural restrained palette and crisp miniature videogame 3D rendering. All depths in focus.
Detail improvement only: resolve existing fine mullions, roof edges/equipment, brick courses, paving joins and railings with crisp newly rendered native detail. No change in architecture, object count or layout. Every building MUST retain its silhouette, roof plan and floor count. Subject geometry and exact registration are higher priorities than decorative realism.
Text: preserve existing tiny marks as already present; add NO new logos, words, letters or labels.
Avoid: camera movement, rotation, crop, outpainting, tighter zoom, new trees/houses/vehicles/objects, taller towers, extra floors, invented facade bays, dramatic lighting, saturation boosts, haze, depth-of-field blur, painterly texture, sharpening halos, UI, markers or watermarks.
Deliver one high-native-resolution image with the exact whole-crop composition.
```

### V2 cobertura completa — accenture

Entrada 1 (edit target): `docs/city-detail-v2/source/accenture-source-crop-v13.png`, rectángulo exacto V13 `[45, 410, 290, 280]`. Salida nativa seleccionada 1277 × 1232; original `/Users/daviddavila/.codex/generated_images/01a0fb25-8161-75d0-83ea-fd700d4f7f0f/exec-9d01ee45-f7c4-4a23-a9cb-26386face0d7.png`.

```text
Use case: precise-object-edit
Asset type: native high-detail local texture for the accenture stop in the accepted mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an EXACT 290 × 280 source-pixel technical crop [45,410,290,280] of approved V13. Reconstruct THIS ENTIRE IMAGE FIELD with the same boundaries and aspect ratio 290:280.
Primary request: re-render the crop at high native resolution, ideally 2048 × 1977 pixels or the largest supported native resolution. This must contain genuinely newly rendered fine detail, not interpolation or sharpening of the small source. Preserve normalized coordinates exactly.
Subject lock: the stepped blue-glass and white office campus with yellow horizontal strips, existing green rooftop terraces and its tall central pale vertical block. Preserve precise footprint, stepped wings, planted roof, facade bay and floor rhythm, height and silhouette.
Composition lock: keep every existing building, house, tree, road, crossing, riverbank, bridge, beach, rock, vehicle, boat, canopy and shadow at precisely its original normalized position and size. Keep all existing partially cut neighboring landmarks PARTIAL at the same boundaries. Preserve original isometric camera, sun direction, natural restrained palette and crisp miniature videogame 3D rendering. All depths in focus.
Detail improvement only: resolve existing fine mullions, roof edges/equipment, brick courses, paving joins and railings with crisp newly rendered native detail. No change in architecture, object count or layout. Every building MUST retain its silhouette, roof plan and floor count. Subject geometry and exact registration are higher priorities than decorative realism.
Text: preserve existing tiny marks as already present; add NO new logos, words, letters or labels.
Avoid: camera movement, rotation, crop, outpainting, tighter zoom, new trees/houses/vehicles/objects, taller towers, extra floors, invented facade bays, dramatic lighting, saturation boosts, haze, depth-of-field blur, painterly texture, sharpening halos, UI, markers or watermarks.
Deliver one high-native-resolution image with the exact whole-crop composition.
```

### MAPFRE — historial de la corrección visual

La primera reconstrucción usó equivocadamente «square» en el prompt y transformó en cuadrados los huecos circulares originales. Se descartó. Una edición localizada devolvió círculos, pero conservó el peor registro horizontal. Se seleccionó la tercera salida, regenerada desde el recorte original con el prompt final anterior. Las tres salidas/hashes/dimensiones se conservan en provenance y los descartes locales, fuera de runtime.

Prompt inicial descartado:

```text
Use case: precise-object-edit
Asset type: native high-detail local texture for the mapfre stop in the accepted mobile miniature-city tour.
Input 1 is the sole EDIT TARGET: an EXACT 220 × 200 source-pixel technical crop [711,437,220,200] of approved V13. Reconstruct THIS ENTIRE IMAGE FIELD with the same boundaries and aspect ratio 220:200.
Primary request: re-render the crop at high native resolution, ideally 2048 × 1862 pixels or the largest supported native resolution. This must contain genuinely newly rendered fine detail, not interpolation or sharpening of the small source. Preserve normalized coordinates exactly.
Subject lock: the SHORT dark blue horizontal-striped rectangular tower, existing roof and its two pale pink low side wings with their small square window pattern. Preserve original height, width, proportions, plan, step heights, wing geometry, floor count and rooftop mast. Never increase the tower height.
Composition lock: keep every existing building, house, tree, road, crossing, riverbank, bridge, beach, rock, vehicle, boat, canopy and shadow at precisely its original normalized position and size. Keep all existing partially cut neighboring landmarks PARTIAL at the same boundaries. Preserve original isometric camera, sun direction, natural restrained palette and crisp miniature videogame 3D rendering. All depths in focus.
Detail improvement only: resolve existing fine mullions, roof edges/equipment, brick courses, paving joins and railings with crisp newly rendered native detail. No change in architecture, object count or layout. Every building MUST retain its silhouette, roof plan and floor count. Subject geometry and exact registration are higher priorities than decorative realism.
Text: preserve existing tiny marks as already present; add NO new logos, words, letters or labels.
Avoid: camera movement, rotation, crop, outpainting, tighter zoom, new trees/houses/vehicles/objects, taller towers, extra floors, invented facade bays, dramatic lighting, saturation boosts, haze, depth-of-field blur, painterly texture, sharpening halos, UI, markers or watermarks.
Deliver one high-native-resolution image with the exact whole-crop composition.
```

Prompt de edición localizada descartada (input 1: primera salida generada; input 2: recorte exacto V13, referencia para los huecos):

```text
Use case: precise-object-edit
Asset type: exact localized architectural fidelity correction of an existing generated city-detail texture.
Input 1 is the EDIT TARGET: the already generated MAPFRE crop, native 1315 × 1196. Input 2 is the original V13 source crop, solely the reference for window hole SHAPE.
Change ONLY the dark window holes on BOTH pale pink side wings of the central blue tower. They are incorrectly square in input 1. In input 2 the holes are clearly CIRCULAR small black portholes. Restore the original round circular window-hole shapes, including the foreshortened round holes on the visible side walls. Keep EVERY hole's existing position, count, size, row/column arrangement and dark interior; change the silhouette of each hole from square to ROUND exactly like the source. Do not add outlines, mullions or decorations to these holes.
Preserve EVERYTHING ELSE in input 1 pixel-for-pixel in composition: blue central SHORT tower, its floor divisions, height, outline, glass, rooftop mast, all rooftop equipment, pink wing silhouettes, floors, roofs, footprint, paving, vegetation, shadows, roads, cars, original crop field and lighting. No new architecture or objects. No text, logos, labels or UI.
Maintain the SAME 1315:1196 aspect ratio and same native resolution or higher. No camera move, recrop, outpainting, zoom, resize of buildings, color change or blur. A single localized circular-window correction only.
```

### Siemens — comprobación de la marca existente

La pequeña placa roja de fachada existe en V13. Recorte exacto `[699,1117,32,28]`, evidencia en `docs/city-detail-v2/comparisons/siemens-red-mark-proof.png`. El revisor independiente confirmó la evidencia y descartó ese hallazgo; no se retocó Siemens.
