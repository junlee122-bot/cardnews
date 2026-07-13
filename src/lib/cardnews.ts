export type SlideRole =
  | "cover"
  | "problem"
  | "insight"
  | "steps"
  | "quote"
  | "checklist"
  | "summary"
  | "cta";

export interface CardSlide {
  id: string;
  role: SlideRole;
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  highlight: string;
  visual: string;
}

export interface CardTheme {
  id: string;
  name: string;
  description: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  accent: string;
  accentForeground: string;
  fontStyle: "sans" | "serif" | "rounded";
  radius: "sharp" | "soft" | "round";
}

export interface BrandKit {
  name: string;
  tagline: string;
  logoText: string;
  primaryColor: string;
  footer: string;
}

export interface CardProject {
  id: string;
  title: string;
  topic: string;
  audience: string;
  tone: string;
  themeId: string;
  createdAt: string;
  updatedAt: string;
  brand: BrandKit;
  slides: CardSlide[];
}

export interface GenerationInput {
  topic: string;
  source?: string;
  audience?: string;
  tone?: string;
  slideCount?: number;
  themeId?: string;
  brand?: Partial<BrandKit>;
}

export const CARD_THEMES = [
  {
    id: "midnight",
    name: "미드나잇 포커스",
    description: "짙은 네이비 위에 라임 포인트가 돋보이는 선명한 프레젠테이션",
    background: "#0B1020",
    surface: "#151D31",
    foreground: "#F7F8FC",
    muted: "#A7B0C4",
    accent: "#C7F36B",
    accentForeground: "#11180A",
    fontStyle: "sans",
    radius: "soft",
  },
  {
    id: "cream-editorial",
    name: "크림 에디토리얼",
    description: "따뜻한 종이 질감과 선명한 레드가 어우러진 매거진 무드",
    background: "#F4EFE5",
    surface: "#FFFDF8",
    foreground: "#241F1A",
    muted: "#776F64",
    accent: "#D84C3F",
    accentForeground: "#FFFFFF",
    fontStyle: "serif",
    radius: "sharp",
  },
  {
    id: "mint-lab",
    name: "민트 랩",
    description: "깨끗한 민트와 딥그린으로 정보를 차분하게 정리하는 스타일",
    background: "#DFF5EC",
    surface: "#F6FFFB",
    foreground: "#12372B",
    muted: "#5D7D72",
    accent: "#087F5B",
    accentForeground: "#FFFFFF",
    fontStyle: "rounded",
    radius: "round",
  },
  {
    id: "cobalt-pop",
    name: "코발트 팝",
    description: "강렬한 블루와 옐로 대비로 시선을 즉시 붙잡는 소셜 카드",
    background: "#1746D1",
    surface: "#2455E7",
    foreground: "#FFFFFF",
    muted: "#C9D6FF",
    accent: "#FFE45C",
    accentForeground: "#14245A",
    fontStyle: "sans",
    radius: "round",
  },
  {
    id: "coral-note",
    name: "코랄 노트",
    description: "코랄과 잉크 컬러로 친근하면서도 생동감 있게 전하는 스타일",
    background: "#FFDDD2",
    surface: "#FFF5F1",
    foreground: "#382524",
    muted: "#876966",
    accent: "#F05D4E",
    accentForeground: "#FFFFFF",
    fontStyle: "rounded",
    radius: "soft",
  },
  {
    id: "mono-grid",
    name: "모노 그리드",
    description: "블랙·화이트와 정교한 그리드로 완성한 단단한 비즈니스 무드",
    background: "#F2F2F0",
    surface: "#FFFFFF",
    foreground: "#111111",
    muted: "#696969",
    accent: "#111111",
    accentForeground: "#FFFFFF",
    fontStyle: "sans",
    radius: "sharp",
  },
] as const satisfies readonly CardTheme[];

const KOREAN_STOP_WORDS = new Set([
  "그리고",
  "그러나",
  "하지만",
  "때문에",
  "대한",
  "통해",
  "위한",
  "있는",
  "없는",
  "하는",
  "되는",
  "있습니다",
  "합니다",
  "것입니다",
  "이것",
  "그것",
  "우리",
  "여러분",
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
]);

const ROLE_SEQUENCE: SlideRole[] = [
  "problem",
  "insight",
  "steps",
  "quote",
  "checklist",
  "insight",
  "steps",
];

let blankSlideSequence = 0;

function clean(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function clampSlideCount(value: number | undefined): number {
  if (!Number.isFinite(value)) return 7;
  return Math.min(10, Math.max(5, Math.round(value as number)));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function safeSlug(value: string): string {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug || "card";
}

/** Creates an ASCII-only, DOM- and filename-safe deterministic identifier. */
export function createSafeId(prefix: string, seed: string): string {
  const safePrefix = safeSlug(prefix) || "item";
  const hash = hashString(seed).toString(36).padStart(7, "0");
  return `${safePrefix}-${safeSlug(seed)}-${hash}`;
}

function stableIso(seed: string): string {
  const start = Date.UTC(2025, 0, 1);
  const span = 365 * 24 * 60 * 60 * 1000;
  return new Date(start + (hashString(seed) % span)).toISOString();
}

function hasBatchim(value: string): boolean {
  const last = Array.from(clean(value)).at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return /[0-9b-df-hj-np-tv-z]$/i.test(last);
  return (code - 0xac00) % 28 !== 0;
}

function particle(value: string, withBatchim: string, withoutBatchim: string): string {
  return hasBatchim(value) ? withBatchim : withoutBatchim;
}

function splitSentences(source: string): string[] {
  return source
    .replace(/\r/g, "\n")
    .split(/(?<=[.!?。！？])\s+|\n+|[•·]\s*/)
    .map((sentence) => clean(sentence).replace(/^[-–—]\s*/, ""))
    .filter((sentence) => sentence.length > 8)
    .slice(0, 12);
}

function shorten(value: string, maxLength: number): string {
  const normalized = clean(value);
  if (normalized.length <= maxLength) return normalized;
  const candidate = normalized.slice(0, maxLength + 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const boundary = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;
  return `${candidate.slice(0, boundary).replace(/[\s,.;:!?]+$/g, "")}…`;
}

function stripFinalPunctuation(value: string): string {
  return clean(value).replace(/[.!?。！？]+$/g, "");
}

function extractKeywords(topic: string, source: string): string[] {
  const counts = new Map<string, { count: number; first: number }>();
  const tokens = `${topic} ${source}`.match(/[가-힣A-Za-z0-9]{2,}/g) ?? [];
  tokens.forEach((rawToken, index) => {
    const token = rawToken.toLowerCase();
    if (KOREAN_STOP_WORDS.has(token) || /^\d+$/.test(token)) return;
    const current = counts.get(token);
    counts.set(token, {
      count: (current?.count ?? 0) + 1,
      first: current?.first ?? index,
    });
  });
  return [...counts.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[1].first - right[1].first)
    .map(([token]) => token)
    .slice(0, 6);
}

function capitalizeKeyword(value: string): string {
  return value.length > 0 ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function toneCopy(tone: string): { promise: string; action: string; mood: string } {
  const normalized = tone.toLowerCase();
  if (/전문|논리|비즈니스|professional|formal/.test(normalized)) {
    return {
      promise: "복잡한 맥락은 덜고 의사결정에 필요한 핵심만 구조적으로 정리했습니다.",
      action: "오늘의 업무에 바로 적용해 보세요.",
      mood: "명확한 근거, 선명한 결론",
    };
  }
  if (/대담|강렬|도발|bold|punch/.test(normalized)) {
    return {
      promise: "당연하게 지나쳤던 장면을 뒤집어, 지금 필요한 결론만 꺼냈습니다.",
      action: "미루지 말고 오늘 한 가지를 바꿔보세요.",
      mood: "관성은 멈추고, 변화는 시작하고",
    };
  }
  if (/차분|따뜻|감성|calm|warm/.test(normalized)) {
    return {
      promise: "천천히 읽어도 오래 남도록, 꼭 필요한 생각을 차분히 담았습니다.",
      action: "내 속도에 맞는 한 걸음부터 시작해 보세요.",
      mood: "서두르지 않아도 분명한 변화",
    };
  }
  return {
    promise: "어려운 설명은 덜고, 한 번에 이해되는 흐름으로 쉽게 풀었습니다.",
    action: "저장해 두고 오늘 한 가지부터 가볍게 실천해 보세요.",
    mood: "쉽게 이해하고, 바로 써먹기",
  };
}

function makeMiddleSlide(
  role: SlideRole,
  occurrence: number,
  index: number,
  topic: string,
  audience: string,
  sentences: string[],
  keywords: string[],
  tone: ReturnType<typeof toneCopy>,
  seed: string,
): CardSlide {
  const sourceAt = (offset: number) =>
    stripFinalPunctuation(sentences[offset % sentences.length]);
  const keyAt = (offset: number) =>
    capitalizeKeyword(keywords[offset % keywords.length] || topic);
  const id = createSafeId("slide", `${seed}:${index}:${role}`);

  if (role === "problem") {
    return {
      id,
      role,
      kicker: "WHY NOW",
      title: `왜 지금, ${topic}${particle(topic, "일까요", "일까요")}`,
      body: `${shorten(sourceAt(0), 92)}. 익숙한 방식만 반복하면 중요한 변화의 신호를 놓치기 쉽습니다.`,
      bullets: [
        `${audience}${particle(audience, "이", "가")} 자주 놓치는 맥락`,
        "정보는 많지만 기준은 흐려지는 순간",
        "알고도 행동으로 이어지지 않는 간극",
      ],
      highlight: "문제를 정확히 이름 붙이면 해결의 절반은 시작됩니다.",
      visual: "큰 물음표와 갈라지는 두 개의 경로",
    };
  }

  if (role === "insight" && occurrence === 0) {
    return {
      id,
      role,
      kicker: "CORE INSIGHT",
      title: `핵심은 ‘${keyAt(0)}’에 있습니다`,
      body: `${shorten(sourceAt(1), 105)}. 결국 중요한 것은 더 많은 정보가 아니라, 무엇을 먼저 볼지 정하는 기준입니다.`,
      bullets: keywords.slice(0, 3).map((keyword, keywordIndex) =>
        `${String(keywordIndex + 1).padStart(2, "0")}  ${capitalizeKeyword(keyword)}`,
      ),
      highlight: tone.mood,
      visual: "중앙 핵심어를 둘러싼 세 개의 연결 노드",
    };
  }

  if (role === "insight") {
    return {
      id,
      role,
      kicker: "NEW ANGLE",
      title: "관점을 바꾸면 답이 짧아집니다",
      body: `${shorten(sourceAt(occurrence + 2), 110)}. 질문을 ‘얼마나 많이’에서 ‘무엇부터’로 바꾸면 다음 행동이 선명해집니다.`,
      bullets: ["덜어낼 것 정하기", "우선순위 한 줄로 쓰기", "작은 결과로 빠르게 확인하기"],
      highlight: `좋은 기준은 ${audience}${particle(audience, "을", "를")} 망설이지 않게 합니다.`,
      visual: "복잡한 선이 하나의 굵은 화살표로 정리되는 장면",
    };
  }

  if (role === "steps" && occurrence === 0) {
    return {
      id,
      role,
      kicker: "3 STEPS",
      title: `${topic}, 이렇게 시작하세요`,
      body: "완벽한 계획보다 순서가 중요합니다. 아래 세 단계면 생각을 실제 변화로 연결할 수 있습니다.",
      bullets: [
        `발견 — ${shorten(sourceAt(0), 42)}`,
        `선택 — ${keyAt(0)}와 ${keyAt(1)} 중 우선순위 정하기`,
        "실행 — 오늘 끝낼 수 있는 크기로 줄이기",
      ],
      highlight: "작게 시작하고, 결과를 보고, 다음 선택을 조정하세요.",
      visual: "1·2·3 숫자가 이어지는 상승형 계단",
    };
  }

  if (role === "steps") {
    return {
      id,
      role,
      kicker: "24H ACTION",
      title: "오늘 안에 끝내는 실행 루틴",
      body: "읽고 끝내지 않도록 가장 작은 행동 단위로 바꿔보세요. 속도보다 완료 경험이 다음 실행을 만듭니다.",
      bullets: ["10분: 내 상황을 한 문장으로 적기", "20분: 가장 쉬운 행동 하나 완료하기", "5분: 결과와 다음 행동 기록하기"],
      highlight: tone.action,
      visual: "24시간 타임라인 위 세 개의 체크포인트",
    };
  }

  if (role === "quote") {
    return {
      id,
      role,
      kicker: "ONE SENTENCE",
      title: `“${shorten(sourceAt(3), 54)}.”`,
      body: "좋은 메시지는 설명을 늘리지 않습니다. 기억해야 할 기준 하나를 남기고, 다음 행동을 자연스럽게 이끕니다.",
      bullets: [],
      highlight: `${keyAt(0)}에서 시작해 ${keyAt(1)}로 증명하세요.`,
      visual: "여백이 넓은 인용문과 작은 따옴표 그래픽",
    };
  }

  return {
    id,
    role: "checklist",
    kicker: "QUICK CHECK",
    title: "실행 전, 이것만 확인하세요",
    body: `${audience}${particle(audience, "에게", "에게")} 필요한 것은 거창한 준비가 아니라 흔들리지 않는 기준입니다. 세 질문에 답하면 출발점이 보입니다.`,
    bullets: [
      `지금 해결할 문제를 한 문장으로 말할 수 있나요?`,
      `${keyAt(0)}의 우선순위가 분명한가요?`,
      "오늘 확인할 수 있는 결과가 정해졌나요?",
    ],
    highlight: "세 항목 중 두 개가 체크되면, 시작할 준비는 충분합니다.",
    visual: "여백 있는 체크박스 세 개와 손글씨 표시",
  };
}

/**
 * Builds a complete, deterministic Korean card-news project without network calls.
 * The same normalized input always produces the same IDs, content and timestamps.
 */
export function generateProject(input: GenerationInput): CardProject {
  const rawSource = clean(input.source);
  const sourceSentences = splitSentences(rawSource);
  const topic = shorten(
    clean(input.topic) || stripFinalPunctuation(sourceSentences[0] ?? "새로운 이야기"),
    46,
  );
  const audience = shorten(clean(input.audience) || "바쁜 실무자", 30);
  const tone = shorten(clean(input.tone) || "명확하고 친근한", 30);
  const slideCount = clampSlideCount(input.slideCount);
  const fallbackSentences = [
    `${topic}${particle(topic, "은", "는")} 지금 알아두면 선택의 기준이 달라지는 주제입니다`,
    `${audience}${particle(audience, "에게", "에게")} 필요한 핵심을 짧고 분명하게 정리할 수 있습니다`,
    `작은 이해를 실제 행동으로 연결할 때 ${topic}의 가치가 선명해집니다`,
    `좋은 변화는 더 많이 아는 순간보다 한 가지를 제대로 시작하는 순간에 만들어집니다`,
  ];
  const sentences = sourceSentences.length > 0 ? sourceSentences : fallbackSentences;
  while (sentences.length < 4) sentences.push(fallbackSentences[sentences.length]);
  const keywords = extractKeywords(topic, rawSource || fallbackSentences.join(" "));
  while (keywords.length < 3) {
    keywords.push(["핵심", "기준", "실행"][keywords.length]);
  }

  const seed = JSON.stringify({ topic, rawSource, audience, tone, slideCount });
  const requestedTheme = CARD_THEMES.find((themeItem) => themeItem.id === input.themeId);
  const theme = requestedTheme ?? CARD_THEMES[hashString(seed) % CARD_THEMES.length];
  const voice = toneCopy(tone);
  const roles = ROLE_SEQUENCE.slice(0, slideCount - 3);
  const roleOccurrences = new Map<SlideRole, number>();

  const slides: CardSlide[] = [
    {
      id: createSafeId("slide", `${seed}:0:cover`),
      role: "cover",
      kicker: "ONE-TOUCH BRIEF",
      title: topic,
      body: voice.promise,
      bullets: [],
      highlight: `${slideCount}장으로 끝내는 핵심 가이드`,
      visual: `${topic}의 핵심을 상징하는 대담한 오브젝트 하나`,
    },
  ];

  roles.forEach((role, roleIndex) => {
    const occurrence = roleOccurrences.get(role) ?? 0;
    slides.push(
      makeMiddleSlide(
        role,
        occurrence,
        roleIndex + 1,
        topic,
        audience,
        sentences,
        keywords,
        voice,
        seed,
      ),
    );
    roleOccurrences.set(role, occurrence + 1);
  });

  slides.push({
    id: createSafeId("slide", `${seed}:${slideCount - 2}:summary`),
    role: "summary",
    kicker: "SAVE THIS",
    title: "딱 세 가지만 기억하세요",
    body: `${topic}${particle(topic, "은", "는")} 지식의 양보다 기준과 순서가 성과를 만듭니다. 필요할 때 다시 볼 수 있도록 이 장을 저장해 두세요.`,
    bullets: [
      `문제 — ${shorten(stripFinalPunctuation(sentences[0]), 46)}`,
      `기준 — ${capitalizeKeyword(keywords[0])}에 먼저 집중하기`,
      "실행 — 오늘 끝낼 수 있는 크기로 시작하기",
    ],
    highlight: "이해 → 선택 → 실행",
    visual: "세 개의 핵심 카드가 하나로 포개지는 구성",
  });

  slides.push({
    id: createSafeId("slide", `${seed}:${slideCount - 1}:cta`),
    role: "cta",
    kicker: "YOUR NEXT MOVE",
    title: "이제, 한 가지를 골라보세요",
    body: voice.action,
    bullets: ["저장하기", "함께 볼 사람에게 공유하기", "오늘의 첫 행동 적기"],
    highlight: `${audience}${particle(audience, "의", "의")} 다음 변화는 지금부터입니다.`,
    visual: "전진하는 화살표와 저장·공유 아이콘",
  });

  const generatedAt = stableIso(seed);
  const defaultBrand: BrandKit = {
    name: "CARDLY",
    tagline: "한 번에 이해되는 이야기",
    logoText: "CARDLY",
    primaryColor: theme.accent,
    footer: `CARDLY · for ${audience}`,
  };
  const brand: BrandKit = {
    name: clean(input.brand?.name) || defaultBrand.name,
    tagline: clean(input.brand?.tagline) || defaultBrand.tagline,
    logoText: clean(input.brand?.logoText) || defaultBrand.logoText,
    primaryColor: clean(input.brand?.primaryColor) || defaultBrand.primaryColor,
    footer: clean(input.brand?.footer) || defaultBrand.footer,
  };

  return {
    id: createSafeId("project", seed),
    title: `${topic} 카드뉴스`,
    topic,
    audience,
    tone,
    themeId: theme.id,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    brand,
    slides,
  };
}

function friendlySentence(value: string): string {
  return clean(value)
    .replace(/해야 합니다\.?/g, "해보면 좋아요.")
    .replace(/할 수 있습니다\.?/g, "할 수 있어요.")
    .replace(/됩니다\.?/g, "돼요.")
    .replace(/입니다\.?/g, "이에요.")
    .replace(/합니다\.?/g, "해요.");
}

/** Returns a rewritten copy and never mutates the supplied slide. */
export function rewriteSlide(
  slide: CardSlide,
  mode: "shorter" | "stronger" | "friendly",
): CardSlide {
  if (mode === "shorter") {
    return {
      ...slide,
      title: shorten(slide.title, 30),
      body: shorten(slide.body, 72),
      bullets: slide.bullets.slice(0, 3).map((bullet) => shorten(bullet, 38)),
      highlight: shorten(slide.highlight, 40),
    };
  }

  if (mode === "friendly") {
    return {
      ...slide,
      title: slide.title.replace(/하세요/g, "해볼까요").replace(/입니다/g, "이에요"),
      body: friendlySentence(slide.body),
      bullets: slide.bullets.map(friendlySentence),
      highlight: friendlySentence(slide.highlight),
    };
  }

  const strongLead: Partial<Record<SlideRole, string>> = {
    cover: "지금 알아야 할",
    problem: "더는 미룰 수 없는",
    insight: "결과를 가르는",
    steps: "바로 실행하는",
    quote: "기억해야 할",
    checklist: "반드시 확인할",
    summary: "결론은 단순합니다",
    cta: "지금 시작하세요",
  };
  const lead = strongLead[slide.role] ?? "핵심";
  return {
    ...slide,
    title: slide.title.startsWith(lead) ? slide.title : `${lead}: ${stripFinalPunctuation(slide.title)}`,
    body: `핵심은 분명합니다. ${clean(slide.body)}`,
    bullets: slide.bullets.map((bullet) => stripFinalPunctuation(bullet)),
    highlight: `${stripFinalPunctuation(slide.highlight)} — 지금 실행하세요.`,
  };
}

/** Creates an editable placeholder slide with a collision-resistant session ID. */
export function createBlankSlide(role: SlideRole = "insight"): CardSlide {
  blankSlideSequence += 1;
  return {
    id: createSafeId("slide-new", `blank:${blankSlideSequence}`),
    role,
    kicker: "NEW SLIDE",
    title: "새로운 제목을 입력하세요",
    body: "이 슬라이드에서 전하고 싶은 내용을 간결하게 적어보세요.",
    bullets: ["첫 번째 핵심 포인트", "두 번째 핵심 포인트", "세 번째 핵심 포인트"],
    highlight: "가장 기억에 남길 한 문장을 입력하세요.",
    visual: "내용을 상징하는 간결한 오브젝트",
  };
}
