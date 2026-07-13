"use client";

import type { CSSProperties } from "react";
import type { BrandKit, CardSlide, CardTheme } from "@/lib/cardnews";

type SlideCanvasProps = {
  slide: CardSlide;
  theme: CardTheme;
  brand: BrandKit;
  index: number;
  total: number;
  editable?: boolean;
  onEdit?: (patch: Partial<CardSlide>) => void;
};

function EditableText({ value, className, multiline = true, editable, onChange }: {
  value: string;
  className: string;
  multiline?: boolean;
  editable?: boolean;
  onChange?: (value: string) => void;
}) {
  if (!editable) return <div className={className}>{value}</div>;
  return (
    <div
      className={`${className} canvas-editable`}
      contentEditable
      role="textbox"
      aria-multiline={multiline}
      suppressContentEditableWarning
      onKeyDown={(event) => {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      onBlur={(event) => onChange?.(event.currentTarget.innerText.trim())}
    >
      {value}
    </div>
  );
}

export function SlideCanvas({ slide, theme, brand, index, total, editable, onEdit }: SlideCanvasProps) {
  const style = {
    "--card-bg": theme.background,
    "--card-surface": theme.surface,
    "--card-text": theme.foreground,
    "--card-muted": theme.muted,
    "--card-accent": brand.primaryColor || theme.accent,
    "--card-accent-text": theme.accentForeground,
  } as CSSProperties;

  return (
    <article className={`slide-canvas font-${theme.fontStyle} radius-${theme.radius} role-${slide.role}`} style={style}>
      <div className="canvas-grid" aria-hidden="true" />
      <div className="canvas-orb canvas-orb-one" aria-hidden="true" />
      <div className="canvas-orb canvas-orb-two" aria-hidden="true" />

      <header className="canvas-header">
        <span className="canvas-brand-mark">{brand.logoText || brand.name.slice(0, 2)}</span>
        <span className="canvas-brand-name">{brand.name}</span>
        <span className="canvas-page">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
      </header>

      <div className="canvas-content">
        {slide.role === "quote" && <div className="quote-mark" aria-hidden="true">“</div>}
        <EditableText value={slide.kicker} className="canvas-kicker" multiline={false} editable={editable} onChange={(kicker) => onEdit?.({ kicker })} />
        {(slide.role === "cover" || slide.role === "cta") && slide.visual && <div className="canvas-visual" aria-hidden="true">{slide.visual}</div>}
        {slide.role === "insight" && slide.highlight && <div className="insight-number" aria-hidden="true">{slide.highlight}</div>}
        <EditableText value={slide.title} className="canvas-title" editable={editable} onChange={(title) => onEdit?.({ title })} />
        {slide.body && <EditableText value={slide.body} className="canvas-body" editable={editable} onChange={(body) => onEdit?.({ body })} />}

        {slide.bullets.length > 0 && ["steps", "checklist", "summary", "problem"].includes(slide.role) && (
          <div className="canvas-bullets">
            {slide.bullets.map((bullet, bulletIndex) => (
              <div className="canvas-bullet" key={`${slide.id}-${bulletIndex}`}>
                <span className="bullet-index">{slide.role === "checklist" || slide.role === "summary" ? "✓" : String(bulletIndex + 1).padStart(2, "0")}</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        )}

        {slide.highlight && !["insight", "quote"].includes(slide.role) && <div className="canvas-highlight">{slide.highlight}</div>}
      </div>

      <footer className="canvas-footer">
        <span>{brand.footer || brand.tagline}</span>
        <span>{brand.footer ? brand.tagline : "SWIPE TO READ"}</span>
      </footer>
    </article>
  );
}

export function MiniSlide({ slide, theme, brand, index }: Omit<SlideCanvasProps, "total" | "editable" | "onEdit">) {
  const style = {
    "--mini-bg": theme.background,
    "--mini-text": theme.foreground,
    "--mini-muted": theme.muted,
    "--mini-accent": brand.primaryColor || theme.accent,
  } as CSSProperties;

  return (
    <div className="mini-slide" style={style}>
      <div className="mini-top"><span>{brand.logoText}</span><span>0{index + 1}</span></div>
      <div className="mini-kicker">{slide.kicker}</div>
      <div className="mini-title">{slide.title}</div>
      {slide.bullets.length > 0 && <div className="mini-lines"><i /><i /><i /></div>}
      <div className="mini-accent" />
    </div>
  );
}
