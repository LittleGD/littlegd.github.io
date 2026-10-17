"""Build app-derived fonts for the current Moraro landing copy.

python3 build-fonts.py --source-fonts /path/to/MoraroOcean/Resources/Fonts --site-root /path/to/littlegd.github.io
Requires fontTools[woff] and Brotli. Reads app fonts and three landing pages;
only writes website moraro/assets/fonts. Rerun whenever landing text changes.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont, woff2
from fontTools.pens.recordingPen import RecordingPen
from html.parser import HTMLParser
import argparse
import hashlib
import json
import shutil

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-fonts',type=Path,required=True)
parser.add_argument('--site-root',type=Path,required=True)
args=parser.parse_args()
APP = args.source_fonts
REPO = args.site_root
OUT = REPO / 'moraro/assets/fonts'
PAGES = {'en': REPO/'moraro/index.html', 'ko': REPO/'moraro/ko/index.html', 'ja': REPO/'moraro/ja/index.html'}

class PageText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.body = False
        self.ignore = 0
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag == 'body': self.body = True
        if tag in ('script','style'): self.ignore += 1
        if self.body and not self.ignore:
            self.parts.extend(value for name,value in attrs if name in ('alt','title','aria-label','placeholder') and value)
    def handle_endtag(self, tag):
        if tag == 'body': self.body = False
        if tag in ('script','style'): self.ignore -= 1
    def handle_data(self, data):
        if self.body and not self.ignore: self.parts.append(data)

def page_text(path):
    parser = PageText(); parser.feed(path.read_text())
    return ' '.join(parser.parts)

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def rename(font, family, style):
    ps = family.replace(' ', '') + '-' + style.replace(' ', '')
    full = family + ' ' + style
    replacements = {1:family, 2:style, 3:'MoraroWeb-20261017;'+ps,
                    4:full, 6:ps, 16:family, 17:style, 18:full,
                    21:family, 22:style, 25:ps}
    for record in list(font['name'].names):
        if record.nameID in replacements:
            font['name'].setName(replacements[record.nameID],record.nameID,record.platformID,record.platEncID,record.langID)
    for name_id,value in replacements.items():
        if name_id in (1,2,3,4,6,16,17): font['name'].setName(value,name_id,3,1,0x409)
    if 'CFF ' in font:
        cff=font['CFF '].cff; cff.fontNames=[ps]
        cff.topDictIndex[0].FamilyName=family
        cff.topDictIndex[0].FullName=full

OUT.mkdir(parents=True, exist_ok=True)
prior_manifest=json.loads((OUT/'font-manifest.json').read_text()) if (OUT/'font-manifest.json').exists() else {}
prior_fonts={f['file']:f for f in prior_manifest.get('fonts',[])}
# Remove earlier full-size names before output: macOS commonly treats the old
# Pretendard-Regular spelling as the same path as pretendard-regular.
for old_name in ('ChangwonDangamRound.woff2','KosugiMaru-Regular.woff2','Pretendard-Regular.woff2',
                 'Pretendard-SemiBold.woff2','PretendardJP-Regular.woff2','PretendardJP-SemiBold.woff2'):
    (OUT/old_name).unlink(missing_ok=True)
texts={lang:page_text(path) for lang,path in PAGES.items()}
base=set(range(0x20,0x7f)) | {0xa0,0x2013,0x2014,0x2018,0x2019,0x201c,0x201d,0x2026}
labels=set(map(ord,'English 한국어 日本語'))
latin_ko=base|labels|set(map(ord,texts['en']+texts['ko']))
japanese=base|labels|set(map(ord,texts['ja']))
specs=[
 ('ChangwonDangamRound.otf','changwon.woff2',None,None,None),
 ('KosugiMaru-Regular.ttf','kosugi-maru.woff2',japanese,None,None),
 ('Pretendard-Regular.otf','pretendard-regular.woff2',latin_ko,'Moraro Web UI','Regular'),
 ('Pretendard-SemiBold.otf','pretendard-semibold.woff2',latin_ko,'Moraro Web UI','SemiBold'),
 ('PretendardJP-Regular.otf','pretendard-jp-regular.woff2',japanese,'Moraro Web UI JP','Regular'),
 ('PretendardJP-SemiBold.otf','pretendard-jp-semibold.woff2',japanese,'Moraro Web UI JP','SemiBold'),
]
records=[]
for filename,output,unicodes,family,style in specs:
    source=APP/filename; target=OUT/output
    original=TTFont(source); orig_cmap=original.getBestCmap()
    if unicodes is None:
        prior=prior_fonts.get(output,{})
        if not (target.exists() and prior.get('source_sha256')==digest(source) and prior.get('woff2_sha256')==digest(target)):
            woff2.compress(source,target,transform_tables=set())
    else:
        font=TTFont(source,recalcTimestamp=False)
        if family: rename(font,family,style)
        options=subset.Options()
        options.layout_features=['*']; options.name_IDs=['*']; options.name_languages=['*']
        options.name_legacy=True; options.glyph_names=True
        options.notdef_glyph=True; options.notdef_outline=True
        worker=subset.Subsetter(options=options)
        worker.populate(unicodes=unicodes)
        worker.subset(font)
        font.flavor='woff2'
        font.save(target)
    converted=TTFont(target); cmap=converted.getBestCmap()
    expected=set(orig_cmap) if unicodes is None else set(orig_cmap)&unicodes
    assert set(cmap)==expected,(filename,'coverage changed')
    before_glyphs=original.getGlyphSet(); after_glyphs=converted.getGlyphSet()
    for code in expected:
        before=before_glyphs[orig_cmap[code]]; after=after_glyphs[cmap[code]]
        p=RecordingPen(); q=RecordingPen(); before.draw(p); after.draw(q)
        assert p.value==q.value,(filename,code,'outline changed')
        assert before.width==after.width,(filename,code,'advance changed')
    names=[n.toUnicode() for n in converted['name'].names if n.nameID in (1,4,6,16)]
    if family: assert not any('Pretendard' in n or 'Source' in n or 'Inter' in n for n in names)
    missing=set() if unicodes is None else unicodes-set(orig_cmap)
    missing_printable=sorted(c for c in missing if c>=32 and not chr(c).isspace())
    records.append({'source':filename,'file':output,'source_bytes':source.stat().st_size,
        'woff2_bytes':target.stat().st_size,'source_sha256':digest(source),'woff2_sha256':digest(target),
        'subset':unicodes is not None,'family':family or converted['name'].getDebugName(1),
        'unicode_mappings':len(cmap),'glyphs':len(converted.getGlyphOrder()),
        'missing_from_original':[f'U+{c:04X} {chr(c)}' for c in missing_printable],
        'verified_all_retained_outlines_and_advances':True,
        'layout_feature_selection':'* (all features relevant to retained glyphs)'})

for name in ('Pretendard-LICENSE.txt','KosugiMaru-LICENSE.txt'):
    shutil.copyfile(APP/name,OUT/name)

manifest={'generator':'moraro/assets/fonts/build-fonts.py','tool':'fontTools 4.63.0 with Brotli',
    'source_directory':'MoraroOcean/Resources/Fonts (external app source; unmodified)','page_sha256':{str(p.relative_to(REPO)):digest(p) for p in PAGES.values()},
    'scope':'Full Changwon; full printable ASCII and current landing body text/labels; EN+KO share body subset, JA has its own body and heading subsets.',
    'font_outline_change':'None for retained characters; unneeded glyphs removed in subsets. OFL subsets renamed internally. Original copyright/license metadata retained.',
    'fonts':records}
(OUT/'font-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
for r in records:
    assert (OUT/r['file']).is_file(),r['file']
    assert digest(OUT/r['file'])==r['woff2_sha256'],r['file']
    print(r['file'],r['woff2_bytes'],r['family'],'missing',r['missing_from_original'])
print('Total WOFF2 bytes:',sum(r['woff2_bytes'] for r in records))
