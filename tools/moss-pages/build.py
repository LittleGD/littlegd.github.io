#!/usr/bin/env python3
"""Builds the Moss's Club house pages (landing, support, terms, privacy) for
every language from i18n/<lang>.json into <site>/moss/. The child safety and
account deletion pages come from docs/<lang>/*.md instead. Usage:
    python3 tools/moss-pages/build.py .   (from the repo root)
"""
import html, json, pathlib, re, sys

SITE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SRC = pathlib.Path(__file__).parent / 'i18n'
DOCS = pathlib.Path(__file__).parent / 'docs'
BASE = 'https://littlegd.github.io'
EMAIL = 'jmjplearner@gmail.com'
AGE = 14  # minimum age in terms and privacy; the app asks for 14 at onboarding
STORE_IOS = ''      # App Store URL once published
STORE_ANDROID = ''  # Google Play URL once published

# code, url slug, html lang, og locale
LANGS = [
    ('en', '', 'en', 'en_US'),
    ('es', 'es', 'es', 'es_ES'),
    ('pt-BR', 'pt-br', 'pt-BR', 'pt_BR'),
    ('fr', 'fr', 'fr', 'fr_FR'),
    ('de', 'de', 'de', 'de_DE'),
    ('ko', 'ko', 'ko', 'ko_KR'),
    ('ja', 'ja', 'ja', 'ja_JP'),
    ('zh-Hans', 'zh-hans', 'zh-Hans', 'zh_CN'),
    ('zh-Hant', 'zh-hant', 'zh-Hant', 'zh_TW'),
]
PAGES = ['', 'support/', 'terms/', 'privacy/', 'child-safety/', 'account-deletion/']


def path(slug, page):
    return '/moss/' + (slug + '/' if slug else '') + page


def esc(s):
    return html.escape(s, quote=True)


def strip_tags(s):
    import re
    return re.sub(r'<[^>]+>', '', s).replace('&gt;', '>').replace('&amp;', '&')


def fill(s, t):
    link = f'<a href="mailto:{EMAIL}">{EMAIL}</a>'
    return s.replace('{age}', str(AGE)).replace('{emailLink}', link).replace('{date}', t['common']['date'])


REDIRECT = '''<script>
/* Each language has a stable address. Only an explicit ?lang= request
   changes language; browser settings never redirect a page. */
(function () {
  var here = %s, urls = %s, want;
  function pick(tag) {
    tag = String(tag || '').toLowerCase();
    if (/^zh-(hant|tw|hk|mo)/.test(tag)) return 'zh-Hant';
    if (/^zh/.test(tag)) return 'zh-Hans';
    return { en: 'en', es: 'es', pt: 'pt-BR', fr: 'fr', de: 'de', ko: 'ko', ja: 'ja' }[tag.split('-')[0]];
  }
  try { want = pick(new URLSearchParams(location.search).get('lang')); } catch (e) {}
  if (want && want !== here) location.replace(urls[want] + location.hash);
})();
</script>'''


def head(t, code, slug, lang, locale, page, title, desc, all_t):
    urls = {c: path(s, page) for c, s, _, _ in LANGS}
    alts = '\n'.join(f'<link rel="alternate" hreflang="{l}" href="{BASE}{path(s, page)}">' for _, s, l, _ in LANGS)
    loc_alt = '\n'.join(f'<meta property="og:locale:alternate" content="{o}">' for c, _, _, o in LANGS if c != code)
    url = BASE + path(slug, page)
    ld = ''
    if page == '':
        ld = '\n<script type="application/ld+json">\n' + json.dumps({
            '@context': 'https://schema.org',
            '@type': 'MobileApplication',
            '@id': BASE + '/moss/#app',
            'name': 'Moss’s Club house',
            'description': desc,
            'url': url,
            'image': BASE + '/assets/moss-icon-512.png',
            'applicationCategory': 'SocialNetworkingApplication',
            'operatingSystem': 'iOS, Android',
            'inLanguage': [l for _, _, l, _ in LANGS],
            'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'},
            'author': {'@type': 'Person', 'name': 'Jongmin Lee'},
        }, ensure_ascii=False, indent=2) + '\n</script>'
    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{REDIRECT % (json.dumps(code), json.dumps(urls))}
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="author" content="Jongmin Lee">
<link rel="canonical" href="{url}">
{alts}
<link rel="alternate" hreflang="x-default" href="{BASE}{path('', page)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#ECEEE9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#202521" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="JML.Studio">
<meta property="og:url" content="{url}">
<meta property="og:locale" content="{locale}">
{loc_alt}
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{BASE}/assets/moss-icon-512.png">
<meta property="og:image:width" content="512">
<meta property="og:image:height" content="512">
<meta property="og:image:alt" content="{esc(t['landing']['artAlt'])}">
<meta name="twitter:card" content="summary">{ld}
<link rel="icon" type="image/png" href="/assets/moss-icon-512.png">
<link rel="apple-touch-icon" href="/moss/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/moss/moss.css">
<script src="/moss/moss.js" defer></script>
<script defer src="/analytics.js"></script>
</head>'''


def header(t, code, page, all_t):
    c = t['common']
    items = ''.join(
        f'<li><a href="{path(s, page)}" hreflang="{l}" lang="{l}"' + (' aria-current="true"' if cc == code else '') +
        f'>{esc(all_t[cc]["langName"])}</a></li>' for cc, s, l, _ in LANGS)
    home = path(slug_of(code), '')
    return f'''<body class="page-{page.strip('/') or 'home'}">
<a class="skip" href="#main">{esc(c['skip'])}</a>
<header class="top"><div class="top-inner wrap">
 <a class="brand" href="{home}"><img src="/assets/moss-icon-512.png" width="36" height="36" alt=""><span translate="no">Moss’s Club house</span></a>
 <details class="lang"><summary><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.25"/><path d="M1.75 8h12.5M8 1.75c1.7 1.8 2.6 3.9 2.6 6.25S9.7 12.45 8 14.25C6.3 12.45 5.4 10.35 5.4 8S6.3 3.55 8 1.75z"/></svg><span class="sr">{esc(c['language'])}: </span>{esc(t['langName'])}</summary><ul class="lang-menu" role="list">{items}</ul></details>
</div></header>'''


def footer(t, code):
    c = t['common']
    s = slug_of(code)
    return f'''<footer class="foot"><div class="wrap foot-inner">
 <nav aria-label="Moss’s Club house"><a href="{path(s, '')}" translate="no">Moss’s Club house</a><a href="{path(s, 'support/')}">{esc(c['support'])}</a><a href="{path(s, 'terms/')}">{esc(c['terms'])}</a><a href="{path(s, 'privacy/')}">{esc(c['privacy'])}</a><a href="{path(s, 'child-safety/')}">{esc(c['childSafety'])}</a><a href="/">JML.Studio</a></nav>
 <p>&copy; 2026 JML.Studio</p>
</div></footer>
</body>
</html>
'''


def slug_of(code):
    return next(s for c, s, _, _ in LANGS if c == code)


def stores(t):
    if STORE_IOS or STORE_ANDROID:
        links = ''
        if STORE_IOS:
            links += f'<a class="store" href="{STORE_IOS}" target="_blank" rel="noopener">App Store</a>'
        if STORE_ANDROID:
            links += f'<a class="store" href="{STORE_ANDROID}" target="_blank" rel="noopener">Google Play</a>'
        return f'<div class="stores">{links}</div>'
    return f'<p class="soon"><span class="dot" aria-hidden="true"></span>{esc(t["common"]["soon"])}</p>'


def landing(t):
    L = t['landing']
    steps = ''.join(f'<li><span class="num" aria-hidden="true">{i:02d}</span><h3>{esc(s["t"])}</h3><p>{esc(s["b"])}</p></li>' for i, s in enumerate(L['steps'], 1))
    facts = ''.join(f'<li>{esc(f)}</li>' for f in L['facts'])
    return f'''<main id="main">
 <section class="hero wrap" aria-labelledby="hero-title">
  <div class="hero-copy">
   <h1 id="hero-title"><span class="sr" translate="no">Moss’s Club house. </span>{L['h1']}</h1>
   <p class="lede">{esc(L['lede'])}</p>
   {stores(t)}
  </div>
  <figure class="portrait"><img src="/moss/assets/moss-portrait.webp" width="720" height="720" alt="{esc(L['artAlt'])}" fetchpriority="high" decoding="async"></figure>
 </section>
 <section class="how wrap" aria-labelledby="how-title">
  <h2 id="how-title" class="label">{esc(L['howTitle'])}</h2>
  <ol class="steps" role="list">{steps}</ol>
 </section>
 <div class="road" aria-hidden="true"><span class="walker"></span></div>
 <section class="facts wrap" aria-labelledby="facts-title">
  <div class="letter">
   <h2 id="facts-title" class="label">{esc(L['factsTitle'])}</h2>
   <ul role="list">{facts}</ul>
   <p class="safety">{esc(L['safety'])}</p>
  </div>
 </section>
</main>'''


def support(t, code):
    S = t['support']
    faq = ''.join(f'<li><h2>{esc(f["q"])}</h2><p>{esc(f["a"])}</p></li>' for f in S['faq'])
    subj = S['subject'].replace(' ', '%20').replace('’', '%E2%80%99')
    return f'''<main id="main" class="wrap narrow doc">
<div class="page-head"><h1>{esc(S['h1'])}</h1><p>{esc(S['lede'])}</p></div>
<section class="panel" id="contact" aria-labelledby="contact-title">
 <h2 id="contact-title">{esc(S['contactTitle'])}</h2>
 <a class="mail" href="mailto:{EMAIL}?subject={subj}">{EMAIL}</a>
 <p>{esc(S['contactBody'])}</p>
</section>
<section class="panel" id="delete-account" aria-labelledby="delete-account-title">
 <h2 id="delete-account-title">{esc(S['deleteTitle'])}</h2>
 <p>{esc(S['deleteParagraphs'][0])}</p>
 <p><a href="https://moss-clubhouse-api-production.motrix.workers.dev/account-deletion?lang={esc(code)}">{esc(S['deleteLink'])}</a></p>
 <p>{esc(S['deleteParagraphs'][1])}</p>
 <p>{esc(S['deleteParagraphs'][2])}</p>
</section>
<section class="panel" id="report" aria-labelledby="report-title">
 <h2 id="report-title">{esc(S['reportTitle'])}</h2>
 <p>{esc(S['reportBody'])}</p>
</section>
<section class="panel danger" id="danger" aria-labelledby="danger-title">
 <h2 id="danger-title">{esc(S['dangerTitle'])}</h2>
 <p>{esc(S['dangerBody'])}</p>
</section>
<ul class="faq" role="list">{faq}</ul>
</main>'''


def legal(t, key):
    D = t[key]
    out = [f'<main id="main" class="wrap narrow doc"><article aria-labelledby="h">',
           f'<div class="page-head"><h1 id="h">{esc(D["h1"])}</h1></div>',
           f'<p class="meta">{esc(t["common"]["effective"].replace("{date}", D.get("date", t["common"]["date"])))}</p>',
           f'<p>{fill(D["intro"], t)}</p>']
    if 'summary' in D:
        out.append(f'<h2>{esc(D["summaryTitle"])}</h2><ul>' + ''.join(f'<li>{fill(s, t)}</li>' for s in D['summary']) + '</ul>')
    for i, sec in enumerate(D['sections'], 1):
        out.append(f'<h2 id="s{i}">{esc(sec["h"])}</h2>')
        out += [f'<p>{fill(p, t)}</p>' for p in sec.get('p', [])]
        if sec.get('list'):
            out.append('<ul>' + ''.join(f'<li>{fill(x, t)}</li>' for x in sec['list']) + '</ul>')
        out += [f'<p>{fill(p, t)}</p>' for p in sec.get('after', [])]
    out.append('</article></main>')
    return '\n'.join(out)


def inline(s):
    s = esc(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)


def markdown(code, name):
    """One docs/<lang>/<name>.md as (title, description, body). Handles what these
    files use: one # title, ## headings, paragraphs, - and 1. lists, bold, links."""
    lines = (DOCS / code / f'{name}.md').read_text().splitlines()
    assert lines[0].startswith('# '), (code, name)
    title, out, kind, desc = lines[0][2:], [], None, ''

    def close():
        nonlocal kind
        if kind:
            out.append(f'</{kind}>')
            kind = None

    for line in lines[1:]:
        item = re.match(r'(- |\d+\. )(.*)', line)
        if item:
            want = 'ul' if item.group(1) == '- ' else 'ol'
            if kind != want:
                close()
                out.append(f'<{want}>')
                kind = want
            out.append(f'<li>{inline(item.group(2))}</li>')
            continue
        close()
        if line.startswith('## '):
            out.append(f'<h2>{inline(line[3:])}</h2>')
        elif line.strip():
            assert not line.startswith(('#', '|', '>', ' ')), (code, name, line)
            first = not out
            out.append(f'<p class="meta">{inline(line)}</p>' if first and name == 'child-safety' else f'<p>{inline(line)}</p>')
            if not desc and not (first and name == 'child-safety'):
                desc = html.unescape(strip_tags(inline(line)))
    close()
    body = '\n'.join(['<main id="main" class="wrap narrow doc"><article aria-labelledby="h">',
                      f'<div class="page-head"><h1 id="h">{esc(title)}</h1></div>', *out, '</article></main>'])
    return title, desc, body


def main():
    all_t = {c: json.loads((SRC / f'{c}.json').read_text()) for c, *_ in LANGS}
    n = 0
    for code, slug, lang, locale in LANGS:
        t = all_t[code]
        for page in PAGES:
            if page == '':
                title, desc, body = t['landing']['title'], t['landing']['description'], landing(t)
            elif page == 'support/':
                title, desc, body = t['support']['title'], t['support']['description'], support(t, code)
            elif page == 'terms/':
                title, desc, body = t['terms']['title'], t['terms']['description'], legal(t, 'terms')
            elif page == 'privacy/':
                title, desc, body = t['privacy']['title'], t['privacy']['description'], legal(t, 'privacy')
            else:
                title, desc, body = markdown(code, page.strip('/'))
            doc = '\n'.join([head(t, code, slug, lang, locale, page, title, desc, all_t), header(t, code, page, all_t), body, footer(t, code)])
            assert '—' not in strip_tags(body), (code, page)
            out = SITE / path(slug, page).lstrip('/') / 'index.html'
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(doc)
            n += 1
    print(f'wrote {n} pages')


if __name__ == '__main__':
    main()
