# JML.Studio

1인 개발 스튜디오 JML.Studio 의 앱 모음 페이지입니다. 출시한 앱을 아이콘과 이름으로 한 화면에 보여주고, `app-ads.txt`(AdMob 앱 인증용)를 같은 도메인에서 호스팅합니다.

빌드 단계 없는 순수 정적 파일(HTML/CSS/JS)이며, GitHub Pages(`littlegd.github.io`)로 배포합니다.

## 구성

- `main.js`: 아이콘 크기와 줄 배치를 화면에 맞추고(스크롤 없음), 로고 픽셀을 선명하게 맞춥니다.
- `glass.js`: 각 아이콘을 유리 슬랩 안에 넣어 WebGL로 그립니다. three.js는 jsDelivr에서 불러옵니다(`index.html`의 importmap). WebGL이나 CDN을 쓸 수 없으면 CSS 아이콘이 그대로 보입니다.
- 유리 효과는 Canvas UI의 Glass Object를 옮겨 온 것입니다. MIT + Commons Clause 라이선스이며 고지는 `third-party/canvas-ui-LICENSE.md` 에 있습니다. 컴포넌트 자체를 따로 재배포하거나 판매하면 안 됩니다.

## 앱 추가하기

1. 512×512 아이콘을 `assets/` 에 넣습니다.
2. `index.html` 의 `<ul class="apps">` 안에 `<li class="app">` 블록을 하나 복사해 링크, 아이콘 경로(`--art` 와 `<img>` 두 곳), 이름을 바꿉니다.

3. 검색엔진용 정보도 맞춥니다. `index.html` `<head>`의 JSON-LD `ItemList`에 앱을 하나 추가하고, 필요하면 `<title>`과 `description`에 앱 이름을 넣은 뒤, `sitemap.xml`의 `lastmod`를 오늘 날짜로 바꿉니다.

아이콘 크기, 한 줄 개수, 유리 슬랩은 앱 수에 맞춰 알아서 조정됩니다.

## 검색 노출

- `robots.txt`와 `sitemap.xml`이 루트에 있습니다.
- Google Search Console에 URL 접두어 속성 `https://littlegd.github.io/`로 등록돼 있습니다(2026-09-15, 사이트맵 제출과 홈 색인 요청 완료). `github.io`의 DNS는 GitHub 소유라 도메인 속성은 쓸 수 없습니다.
- 루트의 `googlecabe5d3c993532ba.html`은 Search Console 소유권 확인 파일입니다. 지우면 소유권 확인이 풀리니 그대로 둡니다.

## GA4 웹 분석

- 속성: [JML Studio](https://analytics.google.com/analytics/web/#/a389775117p556799574/reports/intelligenthome). 포트폴리오와 별도 속성입니다.
- 웹 스트림: `JML Studio Web`, URL `https://littlegd.github.io`, 측정 ID `G-1L3JRK6FVG`, 스트림 ID `15887249636`.
- 공통 태그는 루트의 `analytics.js`에서 관리합니다. 실제 `littlegd.github.io`에서만 로드되므로 로컬 미리보기는 집계되지 않습니다.
- 홈과 FAGL·Moraro의 다국어 소개, 지원, 개인정보 처리방침 페이지에 `<script defer src="/analytics.js"></script>`를 한 번씩 넣습니다. 새 HTML 페이지에도 같은 태그를 추가하세요. Search Console 인증 파일과 `app-ads.txt`에는 넣지 않습니다.
- GA4 향상된 측정은 페이지 조회, 스크롤, 외부 링크 클릭 등을 측정합니다. 앱 자체의 분석 설정과는 별개이며, 웹 태그를 중복 삽입하지 않습니다.
- `main` 변경으로 GitHub Pages가 배포된 뒤 실제 사이트에 방문하고 GA4 실시간 보고서에서 수신을 확인합니다.

## Moss’s Club house 페이지

- `/moss/`에 소개·지원·이용약관·개인정보 처리방침·아동 안전 기준·계정 삭제 안내가 9개 언어(en, es, pt-BR, fr, de, ko, ja, zh-Hans, zh-Hant)로 있습니다. 언어마다 고정 주소(`/moss/ko/privacy/` 등)이고 `?lang=`으로만 바뀝니다.
- HTML은 손으로 고치지 않습니다. 문구는 `tools/moss-pages/i18n/<언어>.json`, 틀은 `tools/moss-pages/build.py`에서 고친 뒤 저장소 루트에서 `python3 tools/moss-pages/build.py .`로 다시 만듭니다. 모든 언어 파일은 `en.json`과 같은 키 구조를 유지합니다.
- 아동 안전 기준(`child-safety/`)과 계정 삭제 안내(`account-deletion/`)는 `tools/moss-pages/docs/<언어>/*.md`가 원문입니다. 앱 저장소 `docs/policy/`에서 자리표시자를 채워 옮긴 것이고, 같은 `build.py`가 HTML로 만듭니다.
- 최소 이용 연령(`AGE`)과 스토어 링크(`STORE_IOS`, `STORE_ANDROID`)는 `build.py` 맨 위에 있습니다. 스토어 링크를 넣으면 "곧 출시" 표시가 스토어 버튼으로 바뀝니다.
- 사용자에게 보이는 문구에 em-dash를 쓰지 않습니다. 빌드가 본문에서 발견하면 멈춥니다.
