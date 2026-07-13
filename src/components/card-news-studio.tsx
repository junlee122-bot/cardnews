"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CARD_THEMES,
  createBlankSlide,
  generateProject,
  rewriteSlide,
  type CardProject,
  type CardSlide,
  type SlideRole,
} from "@/lib/cardnews";
import { exportPngZip, exportSinglePng, printDeckPdf } from "@/lib/export";
import { MiniSlide, SlideCanvas } from "@/components/slide-canvas";

const STORAGE_KEY = "hanjang-cardnews-project-v1";
const ROLE_LABELS: Record<SlideRole, string> = {
  cover: "표지",
  problem: "문제 제기",
  insight: "핵심 인사이트",
  steps: "단계",
  quote: "인용",
  checklist: "체크리스트",
  summary: "요약",
  cta: "마무리 CTA",
};

type PanelTab = "content" | "design" | "brand";
type IconName = "spark" | "arrow" | "plus" | "undo" | "redo" | "download" | "close" | "copy" | "trash" | "wand" | "palette" | "brand" | "text" | "play" | "check" | "back" | "more";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    undo: <path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6"/>,
    redo: <path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6"/>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M5 19h14"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7"/><path d="M10 11v5m4-5v5"/></>,
    wand: <><path d="m4 20 11-11 3 3L7 23 4 20Z"/><path d="m15 4 .7 2.3L18 7l-2.3.7L15 10l-.7-2.3L12 7l2.3-.7L15 4Zm5 10 .5 1.5L22 16l-1.5.5L20 18l-.5-1.5L18 16l1.5-.5L20 14Z"/></>,
    palette: <path d="M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.3-3c-.7-.8-.1-2 1-2H18a3 3 0 0 0 3-3c0-5.5-4-10-9-10Z"/>,
    brand: <><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 9h8M8 13h5"/></>,
    text: <path d="M5 6V4h14v2M12 4v16m-4 0h8"/>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    back: <path d="m15 18-6-6 6-6"/>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Logo() {
  return <div className="app-logo"><span className="logo-symbol">ㅎ</span><span>한장</span><em>STUDIO</em></div>;
}

function cloneProject(project: CardProject): CardProject {
  return JSON.parse(JSON.stringify(project)) as CardProject;
}

export function CardNewsStudio() {
  const [view, setView] = useState<"create" | "studio">("create");
  const [project, setProject] = useState<CardProject | null>(null);
  const [savedDraft, setSavedDraft] = useState<CardProject | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [panelTab, setPanelTab] = useState<PanelTab>("content");
  const [topic, setTopic] = useState("퇴근 후 30분, 나를 성장시키는 작은 습관");
  const [source, setSource] = useState("");
  const [audience, setAudience] = useState("바쁜 직장인");
  const [tone, setTone] = useState("명확하고 따뜻하게");
  const [slideCount, setSlideCount] = useState(7);
  const [themeId, setThemeId] = useState("midnight");
  const [generating, setGenerating] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [exportMenu, setExportMenu] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const historyRef = useRef<CardProject[]>([]);
  const cursorRef = useRef(-1);
  const dragIndexRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedDraft(JSON.parse(raw) as CardProject);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  useEffect(() => {
    if (!project) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSavedDraft(project);
      setSaveState("saved");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [project]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const seedHistory = useCallback((next: CardProject) => {
    const snapshot = cloneProject(next);
    historyRef.current = [snapshot];
    cursorRef.current = 0;
    setProject(snapshot);
  }, []);

  const commit = useCallback((next: CardProject) => {
    const snapshot = cloneProject({ ...next, updatedAt: new Date().toISOString() });
    const kept = historyRef.current.slice(0, cursorRef.current + 1);
    historyRef.current = [...kept, snapshot].slice(-60);
    cursorRef.current = historyRef.current.length - 1;
    setProject(snapshot);
  }, []);

  const canUndo = cursorRef.current > 0;
  const canRedo = cursorRef.current >= 0 && cursorRef.current < historyRef.current.length - 1;

  const undo = () => {
    if (cursorRef.current <= 0) return;
    cursorRef.current -= 1;
    setProject(cloneProject(historyRef.current[cursorRef.current]));
  };

  const redo = () => {
    if (cursorRef.current >= historyRef.current.length - 1) return;
    cursorRef.current += 1;
    setProject(cloneProject(historyRef.current[cursorRef.current]));
  };

  const startGeneration = () => {
    if (!topic.trim()) {
      notify("먼저 카드뉴스 주제를 입력해 주세요.");
      return;
    }
    setGenerating(true);
    window.setTimeout(() => {
      const next = generateProject({ topic, source, audience, tone, slideCount, themeId });
      seedHistory(next);
      setActiveIndex(0);
      setGenerating(false);
      setView("studio");
    }, 650);
  };

  const continueDraft = () => {
    if (!savedDraft) return;
    seedHistory(savedDraft);
    setThemeId(savedDraft.themeId);
    setActiveIndex(0);
    setView("studio");
  };

  if (view === "create" || !project) {
    return (
      <CreateView
        topic={topic} setTopic={setTopic}
        source={source} setSource={setSource}
        audience={audience} setAudience={setAudience}
        tone={tone} setTone={setTone}
        slideCount={slideCount} setSlideCount={setSlideCount}
        themeId={themeId} setThemeId={setThemeId}
        generating={generating} onGenerate={startGeneration}
        savedDraft={savedDraft} onContinue={continueDraft}
      />
    );
  }

  const theme = CARD_THEMES.find((item) => item.id === project.themeId) ?? CARD_THEMES[0];
  const activeSlide = project.slides[activeIndex] ?? project.slides[0];
  const exportTheme = { background: theme.background, text: theme.foreground, muted: theme.muted, accent: project.brand.primaryColor || theme.accent, surface: theme.surface };
  const exportBrand = { name: project.brand.name, handle: project.brand.footer || project.brand.tagline };

  const updateSlide = (index: number, patch: Partial<CardSlide>) => {
    const slides = project.slides.map((slide, slideIndex) => slideIndex === index ? { ...slide, ...patch } : slide);
    commit({ ...project, slides });
  };

  const updateActiveSlide = (patch: Partial<CardSlide>) => updateSlide(activeIndex, patch);

  const deleteSlide = (index: number) => {
    if (project.slides.length <= 1) return notify("카드는 최소 1장 필요합니다.");
    const slides = project.slides.filter((_, slideIndex) => slideIndex !== index);
    commit({ ...project, slides });
    setActiveIndex(Math.min(index, slides.length - 1));
  };

  const duplicateSlide = (index: number) => {
    const original = project.slides[index];
    const fresh = createBlankSlide(original.role);
    const slides = [...project.slides];
    slides.splice(index + 1, 0, { ...original, id: fresh.id, title: `${original.title}` });
    commit({ ...project, slides });
    setActiveIndex(index + 1);
  };

  const addSlide = () => {
    const slides = [...project.slides];
    slides.splice(activeIndex + 1, 0, createBlankSlide("insight"));
    commit({ ...project, slides });
    setActiveIndex(activeIndex + 1);
  };

  const reorderSlides = (from: number, to: number) => {
    if (from === to) return;
    const slides = [...project.slides];
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved);
    commit({ ...project, slides });
    setActiveIndex(to);
  };

  const handleExport = async (kind: "png" | "zip" | "pdf") => {
    setExporting(kind);
    setExportMenu(false);
    try {
      if (kind === "png") await exportSinglePng(activeSlide, exportTheme, exportBrand, activeIndex, project.slides.length, `card-${String(activeIndex + 1).padStart(2, "0")}.png`);
      if (kind === "zip") await exportPngZip(project.slides, exportTheme, exportBrand, `${project.title || "cardnews"}.zip`);
      if (kind === "pdf") await printDeckPdf(project.slides, exportTheme, exportBrand);
      notify(kind === "pdf" ? "인쇄 창에서 PDF로 저장할 수 있어요." : "내보내기를 완료했습니다.");
    } catch {
      notify("내보내는 중 문제가 생겼습니다. 다시 시도해 주세요.");
    } finally {
      setExporting(null);
    }
  };

  const copyCaption = async () => {
    const keywords = project.topic.split(/[\s,]+/).filter((word) => word.length > 1).slice(0, 4);
    const caption = `${project.slides[0]?.title}\n\n${project.slides.slice(1, -1).map((slide) => `• ${slide.title}`).join("\n")}\n\n${keywords.map((word) => `#${word.replace(/[^가-힣a-zA-Z0-9]/g, "")}`).join(" ")} #카드뉴스`;
    await navigator.clipboard.writeText(caption);
    notify("캡션과 해시태그를 복사했습니다.");
  };

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <button className="icon-button back-button" onClick={() => setView("create")} aria-label="처음으로"><Icon name="back" /></button>
        <Logo />
        <div className="project-divider" />
        <input className="project-title-input" value={project.title} onChange={(event) => commit({ ...project, title: event.target.value })} aria-label="프로젝트 제목" />
        <div className="autosave-state"><span className={saveState === "saved" ? "saved-dot" : "saving-dot"} />{saveState === "saved" ? "자동 저장됨" : "저장 중"}</div>
        <div className="topbar-spacer" />
        <div className="history-controls">
          <button className="icon-button" disabled={!canUndo} onClick={undo} aria-label="실행 취소"><Icon name="undo" /></button>
          <button className="icon-button" disabled={!canRedo} onClick={redo} aria-label="다시 실행"><Icon name="redo" /></button>
        </div>
        <button className="secondary-button" onClick={() => setPreview(true)}><Icon name="play" size={16} /> 미리보기</button>
        <div className="export-wrap">
          <button className="primary-button export-button" onClick={() => setExportMenu((open) => !open)} disabled={!!exporting}>
            <Icon name="download" size={16} /> {exporting ? "준비 중…" : "내보내기"}
          </button>
          {exportMenu && (
            <div className="export-menu">
              <button onClick={() => handleExport("png")}><span className="export-icon">PNG</span><span><b>현재 카드</b><small>1080 × 1350 이미지</small></span></button>
              <button onClick={() => handleExport("zip")}><span className="export-icon">ZIP</span><span><b>전체 카드</b><small>{project.slides.length}장 PNG 묶음</small></span></button>
              <button onClick={() => handleExport("pdf")}><span className="export-icon">PDF</span><span><b>PDF 저장</b><small>인쇄용 문서</small></span></button>
              <div className="export-menu-divider" />
              <button onClick={copyCaption}><span className="export-icon"><Icon name="copy" size={16} /></span><span><b>캡션 복사</b><small>요약·해시태그 포함</small></span></button>
            </div>
          )}
        </div>
      </header>

      <main className="studio-grid">
        <aside className="slides-sidebar">
          <div className="sidebar-heading"><span>카드</span><b>{project.slides.length}</b><button className="icon-button small" aria-label="더 보기"><Icon name="more" size={16} /></button></div>
          <div className="slide-list">
            {project.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`thumbnail-row ${index === activeIndex ? "active" : ""}`}
                draggable
                onDragStart={() => { dragIndexRef.current = index; }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => { if (dragIndexRef.current !== null) reorderSlides(dragIndexRef.current, index); dragIndexRef.current = null; }}
              >
                <span className="thumbnail-number">{index + 1}</span>
                <button className="thumbnail-button" onClick={() => setActiveIndex(index)} aria-label={`${index + 1}번 카드 선택`}>
                  <MiniSlide slide={slide} theme={theme} brand={project.brand} index={index} />
                </button>
                <div className="thumbnail-actions">
                  <button onClick={() => duplicateSlide(index)} aria-label="카드 복제"><Icon name="copy" size={13} /></button>
                  <button onClick={() => deleteSlide(index)} aria-label="카드 삭제"><Icon name="trash" size={13} /></button>
                </div>
              </div>
            ))}
          </div>
          <button className="add-slide-button" onClick={addSlide}><Icon name="plus" size={16} /> 카드 추가</button>
        </aside>

        <section className="canvas-workspace">
          <div className="workspace-toolbar">
            <span>{ROLE_LABELS[activeSlide.role]}</span>
            <span className="workspace-tip"><Icon name="text" size={14} /> 캔버스의 글자를 직접 눌러 수정할 수 있어요</span>
            <span className="zoom-chip">4:5 · 72%</span>
          </div>
          <div className="canvas-stage">
            <div className="canvas-frame">
              <SlideCanvas slide={activeSlide} theme={theme} brand={project.brand} index={activeIndex} total={project.slides.length} editable onEdit={updateActiveSlide} />
            </div>
          </div>
          <div className="quick-actions">
            <span><Icon name="spark" size={15} /> 이 카드만 다듬기</span>
            <button onClick={() => updateActiveSlide(rewriteSlide(activeSlide, "shorter"))}>더 짧게</button>
            <button onClick={() => updateActiveSlide(rewriteSlide(activeSlide, "stronger"))}>훅 강화</button>
            <button onClick={() => updateActiveSlide(rewriteSlide(activeSlide, "friendly"))}>더 친근하게</button>
          </div>
        </section>

        <aside className="properties-panel">
          <div className="panel-tabs">
            <button className={panelTab === "content" ? "active" : ""} onClick={() => setPanelTab("content")}><Icon name="text" size={15} /> 콘텐츠</button>
            <button className={panelTab === "design" ? "active" : ""} onClick={() => setPanelTab("design")}><Icon name="palette" size={15} /> 디자인</button>
            <button className={panelTab === "brand" ? "active" : ""} onClick={() => setPanelTab("brand")}><Icon name="brand" size={15} /> 브랜드</button>
          </div>
          {panelTab === "content" && (
            <ContentPanel slide={activeSlide} onChange={updateActiveSlide} onRewrite={(mode) => updateActiveSlide(rewriteSlide(activeSlide, mode))} />
          )}
          {panelTab === "design" && (
            <DesignPanel project={project} onChange={(nextThemeId) => {
              const nextTheme = CARD_THEMES.find((item) => item.id === nextThemeId) ?? CARD_THEMES[0];
              commit({ ...project, themeId: nextThemeId, brand: { ...project.brand, primaryColor: nextTheme.accent } });
            }} />
          )}
          {panelTab === "brand" && (
            <BrandPanel project={project} onChange={(brand) => commit({ ...project, brand: { ...project.brand, ...brand } })} />
          )}
        </aside>
      </main>

      {preview && (
        <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="전체 카드 미리보기">
          <div className="preview-header"><Logo /><span>{project.title}</span><button className="icon-button" onClick={() => setPreview(false)} aria-label="닫기"><Icon name="close" /></button></div>
          <div className="preview-track">
            {project.slides.map((slide, index) => <div className="preview-card" key={slide.id}><SlideCanvas slide={slide} theme={theme} brand={project.brand} index={index} total={project.slides.length} /></div>)}
          </div>
          <div className="preview-hint">좌우로 넘겨 전체 흐름을 확인하세요 · {project.slides.length} cards</div>
        </div>
      )}

      {toast && <div className="toast"><Icon name="check" size={16} />{toast}</div>}
    </div>
  );
}

function CreateView({ topic, setTopic, source, setSource, audience, setAudience, tone, setTone, slideCount, setSlideCount, themeId, setThemeId, generating, onGenerate, savedDraft, onContinue }: {
  topic: string; setTopic: (value: string) => void;
  source: string; setSource: (value: string) => void;
  audience: string; setAudience: (value: string) => void;
  tone: string; setTone: (value: string) => void;
  slideCount: number; setSlideCount: (value: number) => void;
  themeId: string; setThemeId: (value: string) => void;
  generating: boolean; onGenerate: () => void;
  savedDraft: CardProject | null; onContinue: () => void;
}) {
  const examples = ["요즘 직장인이 꼭 알아야 할 AI 활용법", "초보자를 위한 ETF 투자 체크리스트", "지치지 않고 꾸준히 운동하는 방법"];
  return (
    <div className="create-page">
      <header className="create-nav"><Logo /><nav><a href="#how">어떻게 만드나요?</a><a href="#features">기능</a></nav><span className="beta-badge">BETA · 무료</span></header>
      <div className="create-glow create-glow-one" /><div className="create-glow create-glow-two" />
      <main className="create-main">
        <section className="create-hero">
          <div className="eyebrow"><Icon name="spark" size={15} /> 생각을 넘기고 싶은 이야기로</div>
          <h1>주제 한 줄이면,<br/><span>카드뉴스는 완성.</span></h1>
          <p>내용은 똑똑하게 구성하고, 디자인은 알아서 맞춥니다.<br/>만든 뒤에는 글자 하나까지 내 방식대로 고치세요.</p>
          <div className="trust-row"><span><Icon name="check" size={14}/> 가입 없이 바로</span><span><Icon name="check" size={14}/> 자동 저장</span><span><Icon name="check" size={14}/> PNG · ZIP · PDF</span></div>
        </section>

        <section className="generator-card" id="how">
          <div className="generator-top"><div><span className="step-number">01</span><b>무엇을 전하고 싶나요?</b></div><span>AI 초안 · 직접 편집 가능</span></div>
          <div className="topic-field">
            <textarea value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="예: 신입 마케터가 꼭 알아야 할 5가지" maxLength={160} />
            <span>{topic.length}/160</span>
          </div>
          <div className="source-toggle"><label>참고할 메모나 원문 <em>선택</em></label><textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder="기사, 메모, 핵심 포인트를 붙여넣으면 내용에 반영해요." /></div>
          <div className="generator-options">
            <label><span>누가 읽나요?</span><select value={audience} onChange={(event) => setAudience(event.target.value)}><option>바쁜 직장인</option><option>소상공인</option><option>대학생·취준생</option><option>초보 학습자</option><option>전문 실무자</option></select></label>
            <label><span>말투</span><select value={tone} onChange={(event) => setTone(event.target.value)}><option>명확하고 따뜻하게</option><option>전문적이고 간결하게</option><option>친근하고 위트 있게</option><option>설득력 있고 강하게</option></select></label>
            <label><span>카드 수</span><select value={slideCount} onChange={(event) => setSlideCount(Number(event.target.value))}>{[5,6,7,8,9,10].map((count) => <option key={count} value={count}>{count}장</option>)}</select></label>
          </div>
          <div className="theme-picker-label"><span>스타일</span><small>내용은 유지한 채 나중에 바꿀 수 있어요</small></div>
          <div className="landing-themes">
            {CARD_THEMES.map((theme) => <button key={theme.id} className={themeId === theme.id ? "selected" : ""} onClick={() => setThemeId(theme.id)}><i style={{ background: `linear-gradient(135deg, ${theme.background} 0 65%, ${theme.accent} 65%)` }} /><span>{theme.name}</span>{themeId === theme.id && <b><Icon name="check" size={11}/></b>}</button>)}
          </div>
          <button className="generate-button" onClick={onGenerate} disabled={generating}>{generating ? <><span className="spinner"/> 흐름과 디자인을 만드는 중…</> : <><Icon name="spark"/> 원터치로 카드뉴스 만들기 <Icon name="arrow"/></>}</button>
          {savedDraft && <button className="continue-button" onClick={onContinue}><span><Icon name="play" size={15}/><b>마지막 작업 이어하기</b><small>{savedDraft.title} · {savedDraft.slides.length}장</small></span><Icon name="arrow" size={16}/></button>}
        </section>

        <div className="example-row"><span>이런 주제로 시작해 보세요</span>{examples.map((example) => <button key={example} onClick={() => setTopic(example)}>{example}<Icon name="arrow" size={13}/></button>)}</div>
      </main>
      <section className="feature-strip" id="features"><div><b>30초</b><span>첫 초안까지</span></div><i/><div><b>6가지</b><span>편집 가능한 스타일</span></div><i/><div><b>1080×1350</b><span>인스타그램 최적화</span></div><i/><div><b>0원</b><span>첫 버전 전체 기능</span></div></section>
    </div>
  );
}

function ContentPanel({ slide, onChange, onRewrite }: { slide: CardSlide; onChange: (patch: Partial<CardSlide>) => void; onRewrite: (mode: "shorter" | "stronger" | "friendly") => void }) {
  const tooLong = slide.title.length > 54 || slide.body.length > 110;
  const updateBullet = (index: number, value: string) => onChange({ bullets: slide.bullets.map((bullet, bulletIndex) => bulletIndex === index ? value : bullet) });
  return <div className="panel-content">
    <div className="panel-section-heading"><span>카드 내용</span><small>#{slide.id.slice(-4)}</small></div>
    <label className="form-label"><span>역할</span><select value={slide.role} onChange={(event) => onChange({ role: event.target.value as SlideRole })}>{Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="form-label"><span>상단 라벨 <small>{slide.kicker.length}/30</small></span><input value={slide.kicker} onChange={(event) => onChange({ kicker: event.target.value.slice(0, 30) })}/></label>
    <label className="form-label"><span>제목 <small>{slide.title.length}/70</small></span><textarea className="title-area" value={slide.title} onChange={(event) => onChange({ title: event.target.value.slice(0, 70) })}/></label>
    <label className="form-label"><span>본문 <small>{slide.body.length}/160</small></span><textarea value={slide.body} onChange={(event) => onChange({ body: event.target.value.slice(0, 160) })}/></label>
    {slide.bullets.length > 0 && <div className="bullet-editor"><span>목록</span>{slide.bullets.map((bullet, index) => <div key={index}><b>{index + 1}</b><input value={bullet} onChange={(event) => updateBullet(index, event.target.value)}/><button onClick={() => onChange({ bullets: slide.bullets.filter((_, bulletIndex) => bulletIndex !== index) })}><Icon name="close" size={12}/></button></div>)}<button onClick={() => onChange({ bullets: [...slide.bullets, "새로운 핵심 포인트"] })}><Icon name="plus" size={13}/> 항목 추가</button></div>}
    {tooLong && <div className="overflow-note">문장이 조금 길어요. 내보낼 때 자동으로 글자 크기를 맞추지만, 더 짧게 다듬으면 읽기 좋아집니다.</div>}
    <div className="rewrite-box"><div><Icon name="wand" size={16}/><span><b>이 카드만 다시 다듬기</b><small>다른 카드는 그대로 유지돼요</small></span></div><div><button onClick={() => onRewrite("shorter")}>더 짧게</button><button onClick={() => onRewrite("stronger")}>훅 강화</button><button onClick={() => onRewrite("friendly")}>친근하게</button></div></div>
  </div>;
}

function DesignPanel({ project, onChange }: { project: CardProject; onChange: (themeId: string) => void }) {
  return <div className="panel-content"><div className="panel-section-heading"><span>전체 스타일</span><small>문구는 보존됩니다</small></div><p className="panel-description">스타일을 눌러 모든 카드의 색상과 타이포그래피를 한 번에 바꾸세요.</p><div className="design-themes">{CARD_THEMES.map((theme) => <button key={theme.id} className={project.themeId === theme.id ? "selected" : ""} onClick={() => onChange(theme.id)}><div className="theme-preview" style={{ background: theme.background, color: theme.foreground }}><span style={{ background: theme.accent }}/><b>Aa</b><i style={{ background: theme.surface }}/></div><span><b>{theme.name}</b><small>{theme.description}</small></span>{project.themeId === theme.id && <em><Icon name="check" size={12}/></em>}</button>)}</div><div className="design-note"><Icon name="spark" size={15}/><span><b>안전한 자동 맞춤</b><small>한국어 길이에 따라 제목과 본문 크기를 자동으로 조정해요.</small></span></div></div>;
}

function BrandPanel({ project, onChange }: { project: CardProject; onChange: (brand: Partial<CardProject["brand"]>) => void }) {
  const brand = project.brand;
  return <div className="panel-content"><div className="panel-section-heading"><span>미니 브랜드 키트</span><small>전체 카드 적용</small></div><label className="form-label"><span>브랜드 이름</span><input value={brand.name} onChange={(event) => onChange({ name: event.target.value })}/></label><div className="brand-grid"><label className="form-label"><span>로고 글자</span><input value={brand.logoText} maxLength={3} onChange={(event) => onChange({ logoText: event.target.value })}/></label><label className="form-label"><span>포인트 색상</span><span className="color-input"><input type="color" value={brand.primaryColor} onChange={(event) => onChange({ primaryColor: event.target.value })}/><input value={brand.primaryColor} onChange={(event) => onChange({ primaryColor: event.target.value })}/></span></label></div><label className="form-label"><span>한 줄 소개</span><input value={brand.tagline} onChange={(event) => onChange({ tagline: event.target.value })}/></label><label className="form-label"><span>푸터 · 계정</span><input value={brand.footer} onChange={(event) => onChange({ footer: event.target.value })} placeholder="@mybrand"/></label><div className="brand-preview"><span style={{ background: brand.primaryColor }}>{brand.logoText}</span><div><b>{brand.name}</b><small>{brand.tagline}</small></div></div><p className="panel-description">입력한 브랜드 정보는 모든 카드와 내보낸 이미지에 자동으로 반영됩니다.</p></div>;
}
