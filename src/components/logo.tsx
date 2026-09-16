"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** Hold the full name this long after mount before collapsing to "UnitEd". */
const COLLAPSE_AFTER_MS = 1300;
/** Wait this long after pointer leave / blur before re-collapsing. */
const RECOLLAPSE_DELAY_MS = 400;

/** Letters dropped when "Unite Education" morphs into "UnitEd", in order. */
const DROPPED_AFTER_UNIT = ["e"];
const DROPPED_SPACE = [" "];
const DROPPED_AFTER_ED = [..."ucation"];

interface CollapsibleLetterProps {
  /** Stagger index — drives `transition-delay` via `--i`. */
  index: number;
  char: string;
  className?: string;
}

/** A letter that collapses to zero width when the logo is in short form. */
const CollapsibleLetter = ({
  index,
  char,
  className,
}: CollapsibleLetterProps) => (
  <span
    className={cn("logo-letter", className)}
    style={{ "--i": index } as CSSProperties}
  >
    {char}
  </span>
);

interface LogoProps {
  /** Play the "Unite Education" → "UnitEd" morph once on mount (header). */
  animateIntro?: boolean;
  className?: string;
}

const Logo = ({ animateIntro = false, className }: LogoProps) => {
  const { lang } = useParams<{ lang: string }>();
  const [collapsed, setCollapsed] = useState(!animateIntro);
  const recollapseTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!animateIntro) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(
      () => setCollapsed(true),
      reducedMotion ? 0 : COLLAPSE_AFTER_MS,
    );
    return () => window.clearTimeout(timer);
  }, [animateIntro]);

  useEffect(
    () => () => {
      if (recollapseTimer.current !== null) {
        window.clearTimeout(recollapseTimer.current);
      }
    },
    [],
  );

  const expand = () => {
    if (recollapseTimer.current !== null) {
      window.clearTimeout(recollapseTimer.current);
      recollapseTimer.current = null;
    }
    setCollapsed(false);
  };

  const scheduleCollapse = () => {
    if (recollapseTimer.current !== null) {
      window.clearTimeout(recollapseTimer.current);
    }
    recollapseTimer.current = window.setTimeout(
      () => setCollapsed(true),
      RECOLLAPSE_DELAY_MS,
    );
  };

  let i = 0;

  return (
    <Link
      // (app) routes (workspace) have no locale segment — fall back to /en.
      href={lang ? `/${lang}` : "/en"}
      aria-label="Unite Education — home"
      onMouseEnter={expand}
      onMouseLeave={scheduleCollapse}
      onFocus={expand}
      onBlur={scheduleCollapse}
      className={cn(
        "rounded-sm select-none focus-visible:outline-2 focus-visible:outline-offset-4",
        collapsed && "logo-collapsed",
        className,
      )}
    >
      {/* aria-hidden: the link label announces the full name. Every chunk is
          an inline-block with overflow hidden (see globals.css) so dropped
          and surviving letters share the same bottom-edge alignment. */}
      <span
        aria-hidden="true"
        className="logo-text text-lg font-semibold tracking-tighter whitespace-nowrap"
      >
        <span className="text-logo-unit">Unit</span>
        {DROPPED_AFTER_UNIT.map((char) => (
          <CollapsibleLetter
            key={`unit-${char}`}
            index={i++}
            char={char}
            className="text-logo-unit"
          />
        ))}
        {DROPPED_SPACE.map((char) => (
          <CollapsibleLetter key="space" index={i++} char={char} />
        ))}
        <span className="text-logo-ed">Ed</span>
        {DROPPED_AFTER_ED.map((char) => (
          <CollapsibleLetter
            key={`ed-${char}`}
            index={i++}
            char={char}
            className="text-logo-ed"
          />
        ))}
      </span>
    </Link>
  );
};

export { Logo };
