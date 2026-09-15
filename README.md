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
