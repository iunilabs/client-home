from pathlib import Path
from fontTools.ttLib import TTFont
import json
results=[]
for source in Path('public/fonts').glob('*.ttf'):
    target=source.with_suffix('.woff2')
    font=TTFont(source);font.flavor='woff2';font.save(target)
    # WOFF2 transforms preserve outlines, metrics, character coverage and axes.
    restored=TTFont(target)
    for tag in ['cmap','hmtx','hhea','fvar','gvar']:
        if tag in font: assert font[tag].compile(font)==restored[tag].compile(restored),tag
    assert font.getGlyphOrder()==restored.getGlyphOrder()
    results.append(dict(source=str(source),before=source.stat().st_size,after=target.stat().st_size))
Path('docs/performance-2026-10-01/fonts.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
