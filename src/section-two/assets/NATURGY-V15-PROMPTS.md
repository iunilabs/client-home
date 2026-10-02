# Naturgy V15 · 2 de octubre de 2026

Herramienta integrada `image_gen`. Las tres fotografías aportadas por el usuario son las referencias arquitectónicas. Cada primera imagen es el mapa o detalle existente que se edita. Se integró solo el rectángulo local del edificio sobre el original; el máster conserva exactamente los píxeles exteriores. Exportación WebP con dimensiones originales y presupuesto igual o inferior al archivo sustituido. Metadatos y rutas finales en `naturgy-v15-provenance.json`.

## Detalle móvil

```text
Use case: precise-object-edit. Edit ONLY the central blue office building in first image. Other images are architecture references for the real Naturgy building. Preserve exact first-image dimensions, aerial isometric perspective, building position and footprint, every road/tree/neighbor outside the building, bright miniature city illustration style. Replace generic rounded blue glass cube with recognizable real Naturgy Diagonal525 architecture: rectangular upright blue glass front facade with thin dark mullion grid, approximately 8 floors, tall white/silver side fins, large characteristic sweeping white ribbon frame curving inward across the lower facade into the black low podium, open exposed thin rooftop pergola frame instead of rooftop garden. White Naturgy lettering and small orange butterfly near the top. Match reference shape faithfully translated into existing isometric perspective. No generic rounded glass corners, no yellow horizontal bands, no planted roof. Keep building within original footprint and approximate original bounds so existing map camera and roads still align. Surrounding scene remains unchanged.
```

## Mapas generales: prompt común

Se sustituyó `{location}` con cada localización indicada debajo.

```text
Use case: precise-object-edit. First image is the edit target, other images are photographs of real Naturgy building for architecture reference. Replace ONLY {location}. Same building location, approximate bounds and footprint. Faithfully translate reference into existing sunny isometric miniature city illustration: rectangular tall blue glass frontage divided by thin dark mullions, white silver solid tall side fins, very characteristic white ribbon frame bending into an S curve across lower glass facade and black low podium, small exposed steel roof pergola instead of planted garden. About 8 floors. Tiny white Naturgy lettering with orange butterfly at top if legible at this scale. Avoid generic rounded blue glass cube, yellow stripes and garden roof. Keep EVERY other building, road, tree, shoreline, river, composition, perspective, lighting and original image dimensions precisely unchanged. Do not modify neighboring buildings or add other landmarks. Existing interactive roof pins must stay aligned.
```

- Escritorio: `the small rounded blue office building at x51%, y66%, immediately above the canal, between the classical beige palace lower-left and the low square campus right`
- Escritorio ampliado: `the small rounded blue office building at x51%, y61%, immediately above the canal, between the classical beige palace lower-left and the low square campus right`
- Móvil: `the small rounded blue office building at x46%, y61%, immediately above the canal, between the classical beige palace lower-left and the low square campus right`
