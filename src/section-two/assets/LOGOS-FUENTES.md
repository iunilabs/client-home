# Logos de la ciudad

Revisión del 1 de octubre de 2026. Nueve SVG reales y un PNG oficial de alta resolución. Se mantienen las proporciones y se sirven archivos locales importados por Vite; no hay hotlinks de producción. Los SVG no pasan por el limpiador de bitmap. El carrusel los presenta en blanco mediante CSS y las fichas conservan sus colores.

| Organización | Archivo | Fuente y tratamiento |
| --- | --- | --- |
| Accenture | `assets/logos/accenture.svg` | [Cabecera oficial](https://www.accenture.com/es-es). Paths nativos del SVG; posición estática del signo mayor que según la regla `cmp-logo:hover` de su CSS, sin redibujar letras. |
| BBVA | `assets/logos/bbva.svg` | [Cabecera oficial de BBVA](https://www.bbva.mx/personas.html). SVG nativo, color original. |
| Canal de Isabel II | `assets/logos/canal.svg` | [Manual oficial, versión horizontal](https://www.canaldeisabelsegunda.es/documents/20143/4765429/01_MIVC_Elementos%2BBase_Canal%2Bde%2BIsabel%2BII%2B%281%29.pdf/9cc452e4-c6f1-6bca-be12-0afa8234e658?t=1630413320644&version=1.1), página PDF 10. Extracción vectorial mediante Poppler; se descartan los objetos y glifos fuera del recorte y las definiciones sin referencias. Aproximadamente 14,5 KB, sin rasterizar. |
| Cepsa | `assets/logos/cepsa.svg` | [SVG publicado por Moeve](https://www.moeveglobal.com/recursos_corporativo/images/cepsa-logo.svg). Se conserva la denominación histórica Cepsa del listado de Puntoes. |
| MAPFRE | `assets/logos/mapfre.svg` | [Paquete oficial de prensa](https://www.mapfre.com/media/2026/01/Logos.zip), `AF_MAPFRE_LOGOTYPE_HOR_RGB_RED.svg`. Marca de 2026 en minúsculas. |
| Mediaset España | `assets/logos/mediaset.png` | [Paquete oficial](https://files.mediaset.es/file/2024/09/02/logo-mediaset-espana-zip_da39.zip), enlazado en su [sala de prensa](https://www.mediaset.es/comunicacion/corporativo/logotipos/descarga-logos-mediaset_4_2717460005.html). PNG transparente 2060 × 295. El paquete solo contiene JPG y PNG; se conserva el PNG original. |
| Red Eléctrica | `assets/logos/ree.svg` | [SVG de su web oficial](https://www.ree.es/themes/custom/ree/logo.svg). |
| Siemens | `assets/logos/siemens.svg` | [SVG de Wikimedia](https://commons.wikimedia.org/wiki/File:Siemens_AG_logo.svg), basado en el SVG de la cabecera oficial de Siemens y contrastado con su [portal de prensa](https://press.siemens.com/global/en). El enlace antiguo al SVG oficial redirige ahora a HTML. |
| Naturgy | `assets/logos/naturgy.svg` | [SVG enlazado por su web oficial](https://stproportalcorporativo.blob.core.windows.net/uploads/2022/10/logo-naturgy.svg). |
| Banco Sabadell | `assets/sabadell.svg` | [SVG oficial de comunicación](https://comunicacion.grupbancsabadell.com/wp-content/uploads/Logo_BS_BW.svg), ya incorporado en la primera entrega. |
| Telefónica | `assets/logos/telefonica.svg` | [Sprite oficial de su cabecera](https://www.telefonica.com/es/wp-content/themes/telefonica-theme/img/svg/symbol/sprite.svg), símbolo `isotype-text`, conservando paths y definiciones. |
| Indra | `assets/logos/indra.svg` | [SVG de la cabecera oficial de Indra Group](https://www.indragroup.com/cms-content/2025/06/indra-group-logo-dark.svg). El listado de Puntoes usa «Indra Sistemas». |
| Allianz | `assets/logos/allianz.svg` | [SVG de Wikimedia](https://commons.wikimedia.org/wiki/File:Allianz.svg), atribuido a Allianz y procedente de su web oficial. La descarga directa del servidor oficial devuelve 403. |

Las rutas de archivo son relativas a `src/section-two`. Los logos identifican las organizaciones; los derechos de marca pertenecen a sus propietarios. No se afirma una licencia abierta. Se comprueba ausencia de scripts, handlers, elementos `foreignObject` y referencias externas activas en los archivos nuevos.
