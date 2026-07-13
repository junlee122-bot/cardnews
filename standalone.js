const THEMES = [
  { id: "midnight", name: "미드나잇", description: "선명한 대비와 깊이감", background: "#111217", surface: "#1e2027", foreground: "#f7f5ef", muted: "#a2a4ad", accent: "#8b70ff", accentForeground: "#ffffff", fontStyle: "sans", radius: "soft" },
  { id: "cream-editorial", name: "크림 에디토리얼", description: "차분한 매거진 무드", background: "#f4efe3", surface: "#fffaf0", foreground: "#24211d", muted: "#766f65", accent: "#e45b38", accentForeground: "#ffffff", fontStyle: "serif", radius: "sharp" },
  { id: "mint-lab", name: "민트 랩", description: "깨끗하고 지적인 인상", background: "#dff3ec", surface: "#f5fffb", foreground: "#15392f", muted: "#59766d", accent: "#0d8f70", accentForeground: "#ffffff", fontStyle: "rounded", radius: "round" },
  { id: "cobalt-pop", name: "코발트 팝", description: "강하고 자신감 있는 컬러", background: "#1747e8", surface: "#2b58ed", foreground: "#ffffff", muted: "#c7d3ff", accent: "#f7e758", accentForeground: "#172052", fontStyle: "sans", radius: "soft" },
  { id: "coral-note", name: "코랄 노트", description: "따뜻하고 친근한 분위기", background: "#ffded5", surface: "#fff3ef", foreground: "#53251e", muted: "#8d5f57", accent: "#e8503f", accentForeground: "#ffffff", fontStyle: "rounded", radius: "round" },
  { id: "mono-grid", name: "모노 그리드", description: "미니멀하고 구조적인 편집", background: "#f0f0ee", surface: "#ffffff", foreground: "#141414", muted: "#646464", accent: "#111111", accentForeground: "#ffffff", fontStyle: "sans", radius: "sharp" },
];

const ROLE_LABELS = { cover: "표지", problem: "문제 제기", insight: "핵심 인사이트", steps: "단계", quote: "인용", checklist: "체크리스트", summary: "요약", cta: "마무리 CTA" };
const STORAGE_KEY = "hanjang-cardnews-standalone-v1";
const app = document.querySelector("#app");
const saved = safeJson(localStorage.getItem(STORAGE_KEY));

const state = {
  view: saved ? "studio" : "create",
  topic: "퇴근 후 30분, 나를 성장시키는 작은 습관",
  source: "",
  audience: "바쁜 직장인",
  tone: "명확하고 따뜻하게",
  slideCount: 7,
  themeId: "midnight",
  project: saved,
  active: 0,
  panel: "content",
  history: saved ? [clone(saved)] : [],
  cursor: saved ? 0 : -1,
  exportOpen: false,
  preview: false,
};

function safeJson(raw) { try { return raw ? JSON.parse(raw) : null; } catch { return null; } }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function id(prefix = "slide") { return `${prefix}-${Date.now().toString(36)}-${Math.abs(hash(`${prefix}-${performance.now()}`)).toString(36)}`; }
function hash(text) { let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h | 0; }
function e(value = "") { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])); }
function theme() { return THEMES.find((item) => item.id === state.project?.themeId) || THEMES.find((item) => item.id === state.themeId) || THEMES[0]; }
function logo() { return `<div class="app-logo"><span class="logo-symbol">ㅎ</span><span>한장</span><em>STUDIO</em></div>`; }
function icon(name) {
  const paths = {
    spark: `<path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"/>`,
    arrow: `<path d="M5 12h14m-5-5 5 5-5 5"/>`, plus: `<path d="M12 5v14M5 12h14"/>`,
    undo: `<path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6"/>`, redo: `<path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6"/>`,
    download: `<path d="M12 3v12m-4-4 4 4 4-4M5 19h14"/>`, close: `<path d="m6 6 12 12M18 6 6 18"/>`,
    copy: `<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>`,
    trash: `<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7M10 11v5m4-5v5"/>`,
    wand: `<path d="m4 20 11-11 3 3L7 23 4 20Z"/><path d="m15 4 .7 2.3L18 7l-2.3.7L15 10l-.7-2.3L12 7l2.3-.7L15 4Z"/>`,
    text: `<path d="M5 6V4h14v2M12 4v16m-4 0h8"/>`, palette: `<path d="M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.3-3c-.7-.8-.1-2 1-2H18a3 3 0 0 0 3-3c0-5.5-4-10-9-10Z"/>`,
    brand: `<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 9h8M8 13h5"/>`, play: `<path d="m9 7 8 5-8 5V7Z"/>`,
    check: `<path d="m5 12 4 4L19 6"/>`, back: `<path d="m15 18-6-6 6-6"/>`,
  };
  return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}

function buildProject() {
  const topic = state.topic.trim();
  const count = Math.max(5, Math.min(10, state.slideCount));
  const middle = ["problem", "insight", "steps", "quote", "checklist", "insight", "steps"];
  const roles = ["cover", ...middle.slice(0, count - 3), "summary", "cta"];
  const sourceLines = state.source.split(/[\n.!?]+/).map((line) => line.trim()).filter(Boolean);
  const slideFor = (role, index) => {
    const common = { id: id(), role, kicker: `CARD ${String(index + 1).padStart(2, "0")}`, bullets: [], highlight: "", visual: ["✦", "↗", "●", "✓"][index % 4] };
    const source = sourceLines[index % Math.max(1, sourceLines.length)] || "";
    if (role === "cover") return { ...common, kicker: "ONE TOPIC · CLEAR STORY", title: topic, body: `${state.audience}을 위한 ${count}장의 핵심 정리`, highlight: "지금 바로 넘겨보세요" };
    if (role === "problem") return { ...common, kicker: "먼저, 문제부터", title: `왜 ${topic}은 늘 어렵게 느껴질까요?`, body: source || "정보는 많지만, 오늘 당장 무엇부터 해야 할지 선명하지 않기 때문입니다.", bullets: ["목표가 너무 큽니다", "기준 없이 시작합니다", "성과를 너무 빨리 기대합니다"], highlight: "문제는 의지가 아니라 설계입니다" };
    if (role === "insight") return { ...common, kicker: "핵심 인사이트", title: index % 2 ? "작게 시작할수록 오래 갑니다" : "좋은 선택은 기준이 먼저입니다", body: source || `${topic}의 핵심은 많이 하는 것이 아니라, 반복 가능한 최소 단위를 만드는 데 있습니다.`, highlight: index % 2 ? "1%" : "3가지", visual: "↗" };
    if (role === "steps") return { ...common, kicker: "바로 적용하기", title: `${topic}, 이렇게 시작하세요`, body: "복잡한 계획보다 실행 순서를 단순하게 만드세요.", bullets: ["오늘의 목표를 한 문장으로 씁니다", "30분 안에 끝날 크기로 줄입니다", "끝난 뒤 다음 행동을 예약합니다"], highlight: "작게 · 명확하게 · 반복해서" };
    if (role === "quote") return { ...common, kicker: "기억할 한 문장", title: `“완벽한 하루보다, 다시 시작하기 쉬운 하루가 좋습니다.”`, body: `${state.tone} — 한장의 제안`, highlight: "" };
    if (role === "checklist") return { ...common, kicker: "실행 체크리스트", title: "시작 전, 이것만 확인하세요", body: "세 개 중 두 개만 체크돼도 충분히 시작할 수 있습니다.", bullets: ["오늘 바로 할 수 있는가?", "결과를 눈으로 확인할 수 있는가?", "내일 다시 반복할 수 있는가?"], highlight: "체크했다면 이제 실행할 차례" };
    if (role === "summary") return { ...common, kicker: "한 번 더 정리", title: `${topic}의 핵심은 단순합니다`, body: "저장해두고 필요할 때 다시 꺼내 보세요.", bullets: ["목표보다 기준을 먼저 세우기", "가장 작은 행동으로 시작하기", "기록하고 다음 행동을 예약하기"], highlight: "오늘 한 가지부터" };
    return { ...common, kicker: "SAVE · SHARE · START", title: "읽는 데서 멈추지 말고, 오늘 하나를 시작하세요", body: "도움이 됐다면 저장하고, 함께 해보고 싶은 사람에게 공유해 주세요.", highlight: "당신의 다음 한 장은 무엇인가요?", visual: "→" };
  };
  const now = new Date().toISOString();
  return { id: id("project"), title: topic.slice(0, 28), topic, audience: state.audience, tone: state.tone, themeId: state.themeId, createdAt: now, updatedAt: now, brand: { name: "MY BRAND", tagline: "IDEAS WORTH SHARING", logoText: "MY", primaryColor: theme().accent, footer: "@mybrand" }, slides: roles.map(slideFor) };
}

function blankSlide(role = "insight") { return { id: id(), role, kicker: "새로운 카드", title: "제목을 입력하세요", body: "핵심 내용을 간결하게 적어주세요.", bullets: [], highlight: "", visual: "✦" }; }
function seed(project) { state.project = clone(project); state.history = [clone(project)]; state.cursor = 0; state.active = 0; save(); }
function commit(mutator) {
  const next = clone(state.project); mutator(next); next.updatedAt = new Date().toISOString();
  state.history = [...state.history.slice(0, state.cursor + 1), clone(next)].slice(-60); state.cursor = state.history.length - 1; state.project = next; save(); render();
}
function save() { if (state.project) localStorage.setItem(STORAGE_KEY, JSON.stringify(state.project)); }
function undo() { if (state.cursor <= 0) return; state.cursor--; state.project = clone(state.history[state.cursor]); save(); render(); }
function redo() { if (state.cursor >= state.history.length - 1) return; state.cursor++; state.project = clone(state.history[state.cursor]); save(); render(); }
function toast(message) { document.querySelector(".toast")?.remove(); const node = document.createElement("div"); node.className = "toast"; node.innerHTML = `${icon("check")}${e(message)}`; document.body.append(node); setTimeout(() => node.remove(), 2300); }

function slideMarkup(slide, index, editable = false) {
  const t = theme(), brand = state.project.brand, edit = (field) => editable ? `contenteditable="true" data-edit="${field}"` : "";
  const bullets = slide.bullets.length && ["steps", "checklist", "summary", "problem"].includes(slide.role) ? `<div class="canvas-bullets">${slide.bullets.map((bullet, i) => `<div class="canvas-bullet"><span class="bullet-index">${["checklist", "summary"].includes(slide.role) ? "✓" : String(i + 1).padStart(2, "0")}</span><span>${e(bullet)}</span></div>`).join("")}</div>` : "";
  return `<article class="slide-canvas font-${t.fontStyle} radius-${t.radius} role-${slide.role}" style="--card-bg:${t.background};--card-surface:${t.surface};--card-text:${t.foreground};--card-muted:${t.muted};--card-accent:${brand.primaryColor || t.accent};--card-accent-text:${t.accentForeground}">
    <div class="canvas-grid"></div><div class="canvas-orb canvas-orb-one"></div><div class="canvas-orb canvas-orb-two"></div>
    <header class="canvas-header"><span class="canvas-brand-mark">${e(brand.logoText)}</span><span class="canvas-brand-name">${e(brand.name)}</span><span class="canvas-page">${String(index + 1).padStart(2, "0")} / ${String(state.project.slides.length).padStart(2, "0")}</span></header>
    <div class="canvas-content">${slide.role === "quote" ? `<div class="quote-mark">“</div>` : ""}<div class="canvas-kicker canvas-editable" ${edit("kicker")}>${e(slide.kicker)}</div>${["cover", "cta"].includes(slide.role) ? `<div class="canvas-visual">${e(slide.visual)}</div>` : ""}${slide.role === "insight" && slide.highlight ? `<div class="insight-number">${e(slide.highlight)}</div>` : ""}<div class="canvas-title canvas-editable" ${edit("title")}>${e(slide.title)}</div>${slide.body ? `<div class="canvas-body canvas-editable" ${edit("body")}>${e(slide.body)}</div>` : ""}${bullets}${slide.highlight && !["insight", "quote"].includes(slide.role) ? `<div class="canvas-highlight">${e(slide.highlight)}</div>` : ""}</div>
    <footer class="canvas-footer"><span>${e(brand.footer || brand.tagline)}</span><span>${e(brand.footer ? brand.tagline : "SWIPE TO READ")}</span></footer></article>`;
}

function miniMarkup(slide, index) {
  const t = theme(), brand = state.project.brand;
  return `<div class="mini-slide" style="--mini-bg:${t.background};--mini-text:${t.foreground};--mini-muted:${t.muted};--mini-accent:${brand.primaryColor || t.accent}"><div class="mini-top"><span>${e(brand.logoText)}</span><span>0${index + 1}</span></div><div class="mini-kicker">${e(slide.kicker)}</div><div class="mini-title">${e(slide.title)}</div>${slide.bullets.length ? `<div class="mini-lines"><i></i><i></i><i></i></div>` : ""}<div class="mini-accent"></div></div>`;
}

function renderCreate() {
  const examples = ["요즘 직장인이 꼭 알아야 할 AI 활용법", "초보자를 위한 ETF 투자 체크리스트", "지치지 않고 꾸준히 운동하는 방법"];
  app.innerHTML = `<div class="create-page"><header class="create-nav">${logo()}<nav><a href="#how">어떻게 만드나요?</a><a href="#features">기능</a></nav><span class="beta-badge">BETA · 무료</span></header><div class="create-glow create-glow-one"></div><div class="create-glow create-glow-two"></div>
    <main class="create-main"><section class="create-hero"><div class="eyebrow">${icon("spark")} 생각을 넘기고 싶은 이야기로</div><h1>주제 한 줄이면,<br><span>카드뉴스는 완성.</span></h1><p>내용은 똑똑하게 구성하고, 디자인은 알아서 맞춥니다.<br>만든 뒤에는 글자 하나까지 내 방식대로 고치세요.</p><div class="trust-row"><span>${icon("check")} 가입 없이 바로</span><span>${icon("check")} 자동 저장</span><span>${icon("check")} PNG · ZIP · PDF</span></div></section>
    <section class="generator-card" id="how"><div class="generator-top"><div><span class="step-number">01</span><b>무엇을 전하고 싶나요?</b></div><span>자동 초안 · 직접 편집 가능</span></div><div class="topic-field"><textarea id="topic" maxlength="160">${e(state.topic)}</textarea><span>${state.topic.length}/160</span></div><div class="source-toggle"><label>참고할 메모나 원문 <em>선택</em></label><textarea id="source" placeholder="기사, 메모, 핵심 포인트를 붙여넣으면 내용에 반영해요.">${e(state.source)}</textarea></div>
    <div class="generator-options"><label><span>누가 읽나요?</span><select id="audience">${["바쁜 직장인", "소상공인", "대학생·취준생", "초보 학습자", "전문 실무자"].map((x) => `<option ${state.audience === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label><span>말투</span><select id="tone">${["명확하고 따뜻하게", "전문적이고 간결하게", "친근하고 위트 있게", "설득력 있고 강하게"].map((x) => `<option ${state.tone === x ? "selected" : ""}>${x}</option>`).join("")}</select></label><label><span>카드 수</span><select id="slide-count">${[5,6,7,8,9,10].map((x) => `<option value="${x}" ${state.slideCount === x ? "selected" : ""}>${x}장</option>`).join("")}</select></label></div>
    <div class="theme-picker-label"><span>스타일</span><small>내용은 유지한 채 나중에 바꿀 수 있어요</small></div><div class="landing-themes">${THEMES.map((t) => `<button data-theme="${t.id}" class="${state.themeId === t.id ? "selected" : ""}"><i style="background:linear-gradient(135deg,${t.background} 0 65%,${t.accent} 65%)"></i><span>${e(t.name)}</span>${state.themeId === t.id ? `<b>${icon("check")}</b>` : ""}</button>`).join("")}</div>
    <button class="generate-button" id="generate">${icon("spark")} 원터치로 카드뉴스 만들기 ${icon("arrow")}</button>${state.project ? `<button class="continue-button" id="continue"><span>${icon("play")}<b>마지막 작업 이어하기</b><small>${e(state.project.title)} · ${state.project.slides.length}장</small></span>${icon("arrow")}</button>` : ""}</section>
    <div class="example-row"><span>이런 주제로 시작해 보세요</span>${examples.map((x) => `<button data-example="${e(x)}">${e(x)}${icon("arrow")}</button>`).join("")}</div></main>
    <section class="feature-strip" id="features"><div><b>30초</b><span>첫 초안까지</span></div><i></i><div><b>6가지</b><span>편집 가능한 스타일</span></div><i></i><div><b>1080×1350</b><span>인스타그램 최적화</span></div><i></i><div><b>0원</b><span>첫 버전 전체 기능</span></div></section></div>`;
  document.querySelector("#topic").addEventListener("input", (ev) => { state.topic = ev.target.value; ev.target.nextElementSibling.textContent = `${state.topic.length}/160`; });
  document.querySelector("#source").addEventListener("input", (ev) => state.source = ev.target.value);
  document.querySelector("#audience").addEventListener("change", (ev) => state.audience = ev.target.value);
  document.querySelector("#tone").addEventListener("change", (ev) => state.tone = ev.target.value);
  document.querySelector("#slide-count").addEventListener("change", (ev) => state.slideCount = Number(ev.target.value));
  document.querySelectorAll("[data-theme]").forEach((button) => button.addEventListener("click", () => { state.themeId = button.dataset.theme; render(); }));
  document.querySelectorAll("[data-example]").forEach((button) => button.addEventListener("click", () => { state.topic = button.dataset.example; render(); }));
  document.querySelector("#generate").addEventListener("click", (ev) => { if (!state.topic.trim()) return toast("먼저 주제를 입력해 주세요."); ev.currentTarget.innerHTML = `<span class="spinner"></span> 흐름과 디자인을 만드는 중…`; setTimeout(() => { seed(buildProject()); state.view = "studio"; render(); window.scrollTo({ top: 0 }); }, 550); });
  document.querySelector("#continue")?.addEventListener("click", () => { state.view = "studio"; render(); window.scrollTo({ top: 0 }); });
}

function contentPanel(slide) {
  return `<div class="panel-content"><div class="panel-section-heading"><span>카드 내용</span><small>#${e(slide.id.slice(-4))}</small></div><label class="form-label"><span>역할</span><select data-field="role">${Object.entries(ROLE_LABELS).map(([value,label]) => `<option value="${value}" ${slide.role === value ? "selected" : ""}>${label}</option>`).join("")}</select></label><label class="form-label"><span>상단 라벨 <small>${slide.kicker.length}/30</small></span><input data-field="kicker" value="${e(slide.kicker)}"></label><label class="form-label"><span>제목 <small>${slide.title.length}/70</small></span><textarea class="title-area" data-field="title">${e(slide.title)}</textarea></label><label class="form-label"><span>본문 <small>${slide.body.length}/160</small></span><textarea data-field="body">${e(slide.body)}</textarea></label>${slide.bullets.length ? `<div class="bullet-editor"><span>목록</span>${slide.bullets.map((bullet,i) => `<div><b>${i + 1}</b><input data-bullet="${i}" value="${e(bullet)}"><button data-remove-bullet="${i}">${icon("close")}</button></div>`).join("")}<button id="add-bullet">${icon("plus")} 항목 추가</button></div>` : ""}<div class="rewrite-box"><div>${icon("wand")}<span><b>이 카드만 다시 다듬기</b><small>다른 카드는 그대로 유지돼요</small></span></div><div><button data-rewrite="shorter">더 짧게</button><button data-rewrite="stronger">훅 강화</button><button data-rewrite="friendly">친근하게</button></div></div></div>`;
}

function designPanel() {
  return `<div class="panel-content"><div class="panel-section-heading"><span>전체 스타일</span><small>문구는 보존됩니다</small></div><p class="panel-description">스타일을 눌러 모든 카드의 색상과 타이포그래피를 한 번에 바꾸세요.</p><div class="design-themes">${THEMES.map((t) => `<button data-design-theme="${t.id}" class="${state.project.themeId === t.id ? "selected" : ""}"><div class="theme-preview" style="background:${t.background};color:${t.foreground}"><span style="background:${t.accent}"></span><b>Aa</b><i style="background:${t.surface}"></i></div><span><b>${e(t.name)}</b><small>${e(t.description)}</small></span>${state.project.themeId === t.id ? `<em>${icon("check")}</em>` : ""}</button>`).join("")}</div><div class="design-note">${icon("spark")}<span><b>안전한 자동 맞춤</b><small>한국어 길이에 따라 제목과 본문 크기를 자동으로 조정해요.</small></span></div></div>`;
}

function brandPanel() {
  const b = state.project.brand;
  return `<div class="panel-content"><div class="panel-section-heading"><span>미니 브랜드 키트</span><small>전체 카드 적용</small></div><label class="form-label"><span>브랜드 이름</span><input data-brand="name" value="${e(b.name)}"></label><div class="brand-grid"><label class="form-label"><span>로고 글자</span><input data-brand="logoText" maxlength="3" value="${e(b.logoText)}"></label><label class="form-label"><span>포인트 색상</span><span class="color-input"><input data-brand="primaryColor" type="color" value="${e(b.primaryColor)}"><input data-brand="primaryColor" value="${e(b.primaryColor)}"></span></label></div><label class="form-label"><span>한 줄 소개</span><input data-brand="tagline" value="${e(b.tagline)}"></label><label class="form-label"><span>푸터 · 계정</span><input data-brand="footer" value="${e(b.footer)}"></label><div class="brand-preview"><span style="background:${e(b.primaryColor)}">${e(b.logoText)}</span><div><b>${e(b.name)}</b><small>${e(b.tagline)}</small></div></div><p class="panel-description">브랜드 정보는 모든 카드와 내보낸 이미지에 자동 반영됩니다.</p></div>`;
}

function renderStudio() {
  const p = state.project, slide = p.slides[state.active] || p.slides[0];
  const panel = state.panel === "content" ? contentPanel(slide) : state.panel === "design" ? designPanel() : brandPanel();
  app.innerHTML = `<div class="studio-shell"><header class="studio-topbar"><button class="icon-button back-button" id="back">${icon("back")}</button>${logo()}<div class="project-divider"></div><input class="project-title-input" id="project-title" value="${e(p.title)}"><div class="autosave-state"><span class="saved-dot"></span>자동 저장됨</div><div class="topbar-spacer"></div><div class="history-controls"><button class="icon-button" id="undo" ${state.cursor <= 0 ? "disabled" : ""}>${icon("undo")}</button><button class="icon-button" id="redo" ${state.cursor >= state.history.length - 1 ? "disabled" : ""}>${icon("redo")}</button></div><button class="secondary-button" id="preview">${icon("play")} 미리보기</button><div class="export-wrap"><button class="primary-button export-button" id="export">${icon("download")} 내보내기</button>${state.exportOpen ? `<div class="export-menu"><button data-export="png"><span class="export-icon">PNG</span><span><b>현재 카드</b><small>1080 × 1350 이미지</small></span></button><button data-export="zip"><span class="export-icon">ZIP</span><span><b>전체 카드</b><small>${p.slides.length}장 PNG 묶음</small></span></button><button data-export="pdf"><span class="export-icon">PDF</span><span><b>PDF 저장</b><small>인쇄용 문서</small></span></button><div class="export-menu-divider"></div><button id="copy-caption"><span class="export-icon">${icon("copy")}</span><span><b>캡션 복사</b><small>요약·해시태그 포함</small></span></button></div>` : ""}</div></header>
  <main class="studio-grid"><aside class="slides-sidebar"><div class="sidebar-heading"><span>카드</span><b>${p.slides.length}</b></div><div class="slide-list">${p.slides.map((item,i) => `<div class="thumbnail-row ${i === state.active ? "active" : ""}" draggable="true" data-row="${i}"><span class="thumbnail-number">${i + 1}</span><button class="thumbnail-button" data-slide="${i}">${miniMarkup(item,i)}</button><div class="thumbnail-actions"><button data-duplicate="${i}">${icon("copy")}</button><button data-delete="${i}">${icon("trash")}</button></div></div>`).join("")}</div><button class="add-slide-button" id="add-slide">${icon("plus")} 카드 추가</button></aside>
  <section class="canvas-workspace"><div class="workspace-toolbar"><span>${ROLE_LABELS[slide.role]}</span><span class="workspace-tip">${icon("text")} 캔버스의 글자를 직접 눌러 수정할 수 있어요</span><span class="zoom-chip">4:5 · 72%</span></div><div class="canvas-stage"><div class="canvas-frame">${slideMarkup(slide,state.active,true)}</div></div><div class="quick-actions"><span>${icon("spark")} 이 카드만 다듬기</span><button data-rewrite="shorter">더 짧게</button><button data-rewrite="stronger">훅 강화</button><button data-rewrite="friendly">더 친근하게</button></div></section>
  <aside class="properties-panel"><div class="panel-tabs"><button data-panel="content" class="${state.panel === "content" ? "active" : ""}">${icon("text")} 콘텐츠</button><button data-panel="design" class="${state.panel === "design" ? "active" : ""}">${icon("palette")} 디자인</button><button data-panel="brand" class="${state.panel === "brand" ? "active" : ""}">${icon("brand")} 브랜드</button></div>${panel}</aside></main>
  ${state.preview ? `<div class="preview-overlay"><div class="preview-header">${logo()}<span>${e(p.title)}</span><button class="icon-button" id="close-preview">${icon("close")}</button></div><div class="preview-track">${p.slides.map((item,i) => `<div class="preview-card">${slideMarkup(item,i)}</div>`).join("")}</div><div class="preview-hint">좌우로 넘겨 전체 흐름을 확인하세요 · ${p.slides.length} cards</div></div>` : ""}</div>`;
  bindStudio();
}

function rewrite(mode) {
  commit((p) => { const s = p.slides[state.active]; if (mode === "shorter") { s.title = s.title.replace(/(해야 합니다|할 수 있습니다|입니다)/g, "").slice(0, 38); s.body = s.body.split(/[.!?]/)[0].slice(0, 80); } if (mode === "stronger") { s.title = s.title.replace(/^[!⚡ ]+/, ""); s.title = `지금 놓치면 아쉬운, ${s.title}`.slice(0, 62); s.kicker = "꼭 알아둘 핵심"; } if (mode === "friendly") { s.title = s.title.replace(/합니다/g, "해봐요"); s.body = `${s.body.replace(/합니다/g, "해보세요")} 오늘 하나만 해도 충분해요.`.slice(0, 145); } });
}

function bindStudio() {
  document.querySelector("#back").addEventListener("click", () => { state.view = "create"; render(); window.scrollTo({ top: 0 }); });
  document.querySelector("#undo").addEventListener("click", undo); document.querySelector("#redo").addEventListener("click", redo);
  document.querySelector("#project-title").addEventListener("change", (ev) => commit((p) => p.title = ev.target.value));
  document.querySelector("#preview").addEventListener("click", () => { state.preview = true; render(); }); document.querySelector("#close-preview")?.addEventListener("click", () => { state.preview = false; render(); });
  document.querySelector("#export").addEventListener("click", () => { state.exportOpen = !state.exportOpen; render(); });
  document.querySelectorAll("[data-slide]").forEach((button) => button.addEventListener("click", () => { state.active = Number(button.dataset.slide); render(); }));
  document.querySelectorAll("[data-duplicate]").forEach((button) => button.addEventListener("click", () => { const i = Number(button.dataset.duplicate); state.active = i + 1; commit((p) => { const copy = clone(p.slides[i]); copy.id = id(); p.slides.splice(i + 1, 0, copy); }); }));
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => { const i = Number(button.dataset.delete); if (state.project.slides.length <= 1) return toast("카드는 최소 한 장 필요해요."); state.active = Math.min(i, state.project.slides.length - 2); commit((p) => p.slides.splice(i,1)); }));
  document.querySelector("#add-slide").addEventListener("click", () => { const at = state.active + 1; state.active = at; commit((p) => p.slides.splice(at,0,blankSlide())); });
  let dragged = null; document.querySelectorAll("[data-row]").forEach((row) => { row.addEventListener("dragstart", () => dragged = Number(row.dataset.row)); row.addEventListener("dragover", (ev) => ev.preventDefault()); row.addEventListener("drop", () => { const to = Number(row.dataset.row); if (dragged === null || dragged === to) return; state.active = to; commit((p) => { const [moved] = p.slides.splice(dragged,1); p.slides.splice(to,0,moved); }); dragged = null; }); });
  document.querySelectorAll("[data-panel]").forEach((button) => button.addEventListener("click", () => { state.panel = button.dataset.panel; render(); }));
  document.querySelectorAll("[data-field]").forEach((input) => {
    const field = input.dataset.field;
    if (input.tagName === "SELECT") {
      input.addEventListener("change", () => commit((p) => p.slides[state.active][field] = input.value));
      return;
    }
    input.addEventListener("input", () => {
      state.project.slides[state.active][field] = input.value;
      const canvasField = document.querySelector(`.canvas-frame [data-edit="${field}"]`);
      if (canvasField) canvasField.textContent = input.value;
      save();
    });
    input.addEventListener("blur", () => commit(() => {}));
  });
  document.querySelectorAll("[data-edit]").forEach((node) => node.addEventListener("blur", () => { const field = node.dataset.edit; commit((p) => p.slides[state.active][field] = node.innerText.trim()); }));
  document.querySelectorAll("[data-bullet]").forEach((input) => input.addEventListener("change", () => { const i = Number(input.dataset.bullet); commit((p) => p.slides[state.active].bullets[i] = input.value); }));
  document.querySelectorAll("[data-remove-bullet]").forEach((button) => button.addEventListener("click", () => { const i = Number(button.dataset.removeBullet); commit((p) => p.slides[state.active].bullets.splice(i,1)); }));
  document.querySelector("#add-bullet")?.addEventListener("click", () => commit((p) => p.slides[state.active].bullets.push("새로운 핵심 포인트")));
  document.querySelectorAll("[data-rewrite]").forEach((button) => button.addEventListener("click", () => rewrite(button.dataset.rewrite)));
  document.querySelectorAll("[data-design-theme]").forEach((button) => button.addEventListener("click", () => commit((p) => { const t = THEMES.find((x) => x.id === button.dataset.designTheme); p.themeId = t.id; p.brand.primaryColor = t.accent; })));
  document.querySelectorAll("[data-brand]").forEach((input) => input.addEventListener("change", () => commit((p) => p.brand[input.dataset.brand] = input.value)));
  document.querySelectorAll("[data-export]").forEach((button) => button.addEventListener("click", () => doExport(button.dataset.export)));
  document.querySelector("#copy-caption")?.addEventListener("click", copyCaption);
}

function render() { if (state.view === "create" || !state.project) renderCreate(); else renderStudio(); }

function xml(value = "") { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char])); }
function wrap(text, max) { const chars = Array.from(String(text)); const lines = []; let current = ""; for (const ch of chars) { if (current.length >= max && /[\s,·.!?]|[가-힣]/.test(ch)) { lines.push(current.trim()); current = ""; } current += ch; } if (current.trim()) lines.push(current.trim()); return lines.slice(0,5); }
function textLines(lines, x, y, size, lineHeight, color, weight = 700, anchor = "start") { return lines.map((line,i) => `<text x="${x}" y="${y + i * lineHeight}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" font-family="Arial,'Noto Sans KR',sans-serif">${xml(line)}</text>`).join(""); }
function renderSvg(slide, index) {
  const t = theme(), b = state.project.brand, accent = b.primaryColor || t.accent, titleLines = wrap(slide.title, slide.role === "cover" ? 12 : 15), bodyLines = wrap(slide.body, 27), titleSize = slide.role === "cover" ? 90 : 78, titleY = slide.role === "insight" ? 490 : 420;
  const bulletStart = titleY + titleLines.length * 92 + (bodyLines.length ? 92 : 45);
  const bullets = slide.bullets.slice(0,4).map((bullet,i) => `<rect x="84" y="${bulletStart + i*105}" width="912" height="82" rx="18" fill="${t.surface}"/><rect x="105" y="${bulletStart + 18 + i*105}" width="46" height="46" rx="12" fill="${accent}"/>${textLines([slide.role === "checklist" ? "✓" : String(i+1)],128,bulletStart+50+i*105,22,26,t.accentForeground,800,"middle")}${textLines(wrap(bullet,32).slice(0,1),176,bulletStart+52+i*105,28,34,t.foreground,650)}`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${t.background}"/><g opacity=".08" stroke="${t.muted}">${Array.from({length:12},(_,i)=>`<path d="M${i*108} 0V1350"/>`).join("")}${Array.from({length:14},(_,i)=>`<path d="M0 ${i*108}H1080"/>`).join("")}</g><circle cx="1040" cy="260" r="230" fill="${accent}" opacity=".16"/><circle cx="-30" cy="1080" r="110" fill="none" stroke="${accent}" stroke-width="42" opacity=".13"/><rect x="82" y="76" width="54" height="54" rx="14" fill="${accent}"/>${textLines([b.logoText],109,112,18,20,t.accentForeground,800,"middle")}${textLines([b.name],155,111,18,20,t.foreground,750)}${textLines([`${String(index+1).padStart(2,"0")} / ${String(state.project.slides.length).padStart(2,"0")}`],995,111,17,20,t.muted,600,"end")}<rect x="82" y="238" width="${Math.max(170, slide.kicker.length*18)}" height="48" rx="24" fill="${accent}"/>${textLines([slide.kicker],101,270,19,22,t.accentForeground,800)}${slide.role === "insight" ? textLines([slide.highlight],82,410,122,130,accent,850) : ""}${textLines(titleLines,82,titleY,titleSize,92,t.foreground,830)}${textLines(bodyLines,82,titleY+titleLines.length*92+35,31,48,t.muted,500)}${bullets}${slide.highlight && !["insight","quote"].includes(slide.role) ? `<rect x="82" y="1090" width="760" height="76" rx="14" fill="${t.surface}"/><rect x="82" y="1090" width="8" height="76" fill="${accent}"/>${textLines(wrap(slide.highlight,30).slice(0,1),112,1138,28,34,accent,760)}` : ""}${["cover","cta"].includes(slide.role) ? `<rect x="840" y="310" width="130" height="130" rx="32" fill="${accent}" transform="rotate(8 905 375)"/>${textLines([slide.visual],905,397,58,60,t.accentForeground,800,"middle")}` : ""}${textLines([b.footer || b.tagline],82,1278,17,20,t.muted,650)}${textLines([b.tagline],998,1278,17,20,t.muted,650,"end")}</svg>`;
}
async function svgPng(svg) { const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob); try { const image = new Image(); image.src = url; await image.decode(); const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350; const ctx = canvas.getContext("2d"); ctx.drawImage(image,0,0,1080,1350); return await new Promise((resolve,reject) => canvas.toBlob((out) => out ? resolve(out) : reject(new Error("PNG 변환 실패")),"image/png")); } finally { URL.revokeObjectURL(url); } }
function download(blob, name) { const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000); }
const crcTable = (() => { const table = new Uint32Array(256); for (let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}return table; })();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function u16(n){return new Uint8Array([n&255,(n>>>8)&255]);} function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);}
function join(parts){const length=parts.reduce((sum,p)=>sum+p.length,0),out=new Uint8Array(length);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;}
function makeZip(files){const enc=new TextEncoder(),locals=[],centrals=[];let offset=0;for(const file of files){const name=enc.encode(file.name),data=file.data,crc=crc32(data);const local=join([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);locals.push(local);const central=join([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);centrals.push(central);offset+=local.length;}const centralData=join(centrals);return join([...locals,centralData,u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralData.length),u32(offset),u16(0)]);}
async function doExport(kind) { state.exportOpen = false; render(); toast("내보내기 파일을 준비하고 있어요."); if (kind === "png") { const blob = await svgPng(renderSvg(state.project.slides[state.active],state.active)); download(blob,`card-${String(state.active+1).padStart(2,"0")}.png`); } if (kind === "zip") { const files=[]; for(let i=0;i<state.project.slides.length;i++){const blob=await svgPng(renderSvg(state.project.slides[i],i));files.push({name:`card-${String(i+1).padStart(2,"0")}.png`,data:new Uint8Array(await blob.arrayBuffer())});} download(new Blob([makeZip(files)],{type:"application/zip"}),`${state.project.title}.zip`); } if (kind === "pdf") { const win=window.open("","_blank"); if(!win)return toast("팝업을 허용한 뒤 다시 시도해 주세요."); const pages=state.project.slides.map((s,i)=>`<section><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSvg(s,i))}"></section>`).join(""); win.document.write(`<title>${e(state.project.title)}</title><style>@page{size:1080px 1350px;margin:0}body{margin:0}section{page-break-after:always;width:1080px;height:1350px}img{width:100%;height:100%}</style>${pages}<script>setTimeout(()=>print(),700)<\/script>`); win.document.close(); } setTimeout(() => toast(kind === "pdf" ? "인쇄 창에서 PDF로 저장하세요." : "내보내기를 완료했습니다."),200); }
async function copyCaption(){const keywords=state.project.topic.split(/[\s,]+/).filter((x)=>x.length>1).slice(0,4);const text=`${state.project.slides[0].title}\n\n${state.project.slides.slice(1,-1).map((s)=>`• ${s.title}`).join("\n")}\n\n${keywords.map((x)=>`#${x.replace(/[^가-힣a-zA-Z0-9]/g,"")}`).join(" ")} #카드뉴스`;await navigator.clipboard.writeText(text);state.exportOpen=false;render();toast("캡션과 해시태그를 복사했습니다.");}

render();
requestAnimationFrame(() => window.scrollTo({ top: 0 }));
