#!/usr/bin/env python3
"""Verify localized rewarded-shop policy coverage and the generated pages."""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCALES = ('en', 'es', 'pt-BR', 'fr', 'de', 'ko', 'ja', 'zh-Hans', 'zh-Hant')
PAGES = {'landing': '', 'support': 'support', 'terms': 'terms', 'privacy': 'privacy'}
STALE = re.compile(
    r'\bno (?:third-party )?ads\b|\bad.free\b|without (?:analytics or )?advertising SDKs|'
    r'\bsin anuncios\b|\bsem anúncios\b|\bsans publicité\b|ohne Werbung|keine Werbung|'
    r'광고가 없|광고도, 유료|제3자 광고나|広告(?:なしです|はありません|も有料機能も)|'
    r'(?:没有广告|無廣告|无广告|沒有廣告)|(?:不使用分析或广告 SDK|不使用分析或廣告 SDK)',
    re.IGNORECASE,
)
# Each of these means a global ad-free claim only in the landing text.
# Youth's explicitly ad-free option is correct and excluded here.
STALE_GLOBAL = re.compile(
    r'\bwith no ads\b|no third-party ads|no (?:analytics or )?advertising SDKs|'
    r'gratis,? (?:y )?sin anuncios|grátis,? (?:e )?sem anúncios|gratuit,? sans publicité|'
    r'kostenlos(?: und|,)? ohne Werbung|keine Werbung Dritter|'
    r'광고가 없|광고도, 유료|제3자 광고나|広告(?:なしです|はありません|も有料機能も)|'
    r'(?:没有广告|無廣告|无广告|沒有廣告)|(?:不使用分析或广告 SDK|不使用分析或廣告 SDK)',
    re.IGNORECASE,
)


def shape(value):
    if isinstance(value, dict):
        return {key: shape(field) for key, field in value.items()}
    if isinstance(value, list):
        return [shape(item) for item in value]
    return type(value).__name__


def check():
    expected_shape = None
    for locale in LOCALES:
        doc = json.loads((Path(__file__).parent / 'i18n' / f'{locale}.json').read_text())
        current = shape(doc)
        if expected_shape is None:
            expected_shape = current
        assert current == expected_shape, (locale, 'localized structure')
        landing = doc['landing']
        for text in (landing['description'], *landing['facts']):
            assert not STALE.search(text), (locale, text)
        privacy, terms, support = (doc[key] for key in ('privacy', 'terms', 'support'))
        sections = privacy['sections']
        reward = terms['sections'][6]['p'][0]
        assert re.findall(r'(\d+)\s*%', reward) == ['2', '20', '50', '20', '8'], locale
        for text in (reward, privacy['summary'][3], support['faq'][-1]['a'], sections[0]['p'][-2]):
            assert all(re.search(rf'(?<!\d){age}(?!\d)', text) for age in [18, 19]), (locale, text)
            assert not STALE_GLOBAL.search(text), (locale, text)
        assert re.search(r'(?<!\d)18(?!\d)', sections[7]['p'][-1]), locale
        assert terms['date'] == privacy['date'] and re.search(r'(?<!\d)5(?!\d)', terms['date']), locale
        providers = sections[4]['list']
        assert all(marker in providers[2] for marker in ('APNs', 'FCM')), locale
        assert all(marker in providers[3] for marker in ('Google AdMob', 'https://policies.google.com/privacy', 'IP', 'IDFA', 'Android', 'SDK')), locale
        assert len(sections[2]['p']) == 2 and len(sections[5]['p']) == 6 and len(sections[6]['p']) == 3, locale
        base = ROOT / 'moss' / ('' if locale == 'en' else locale.lower())
        evidence = {
            'landing': [landing['description'], landing['facts'][2]],
            'support': [support['faq'][-1]['a']],
            'terms': [terms['date'], reward],
            'privacy': [privacy['date'], privacy['summary'][3], sections[0]['p'][-2], sections[2]['p'][-1],
                        providers[2], providers[3], sections[5]['p'][-1], sections[6]['p'][1], sections[7]['p'][-1]],
        }
        for page, fragments in evidence.items():
            output = (base / PAGES[page] / 'index.html').read_text()
            assert f'<html lang="{locale}">' in output, (locale, page)
            assert not STALE_GLOBAL.search(output), (locale, page, 'stale ad-free claim')
            for fragment in fragments:
                assert fragment in output or html.escape(fragment, quote=True) in output, (locale, page, fragment)
    assert len(list((ROOT / 'moss').glob('**/index.html'))) == 36
    print('PASS: 9 locale structures, 36 generated pages, rewards 2/20/50/20/8%, age/AdMob and APNs/FCM coverage, no global ad-free claims.')


if __name__ == '__main__':
    check()
