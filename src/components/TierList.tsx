"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { createPortal } from "react-dom";

const DockContext = React.createContext<MotionValue<number> | null>(null);

export type TierItem = {
  id: string;
  label?: string;
  emoji?: string;
  image?: string;
};

export type Tier = {
  id: string;
  label: string;
  color: string;
  items: TierItem[];
};

export type TierListValue = {
  tiers: Tier[];
  pool: TierItem[];
};

export type TierListProps = {
  value: TierListValue;
  onChange: (next: TierListValue) => void;
  onRemoveItem?: (itemId: string) => void;
  tierColors?: string[];
  tileSize?: number;
  readOnly?: boolean;
  className?: string;
};

const SPRING = { type: "spring" as const, stiffness: 560, damping: 38, mass: 0.7 };

// Any CSS background value works (gradients read more premium than flat fills).
const TIER_COLORS = [
  "linear-gradient(135deg,#FB7185,#9F1239)", // S - rose to crimson
  "linear-gradient(135deg,#FDBA74,#C2410C)", // A - amber to burnt orange
  "linear-gradient(135deg,#FDE047,#A16207)", // B - gold
  "linear-gradient(135deg,#4ADE80,#047857)", // C - emerald
  "linear-gradient(135deg,#38BDF8,#0369A1)", // D - sky to ocean
  "linear-gradient(135deg,#A78BFA,#6D28D9)", // violet
  "linear-gradient(135deg,#F0ABFC,#A21CAF)", // fuchsia
  "linear-gradient(135deg,#94A3B8,#475569)", // slate
];

const POOL = "pool";
const CAPTION_H = 20;

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function TierList({
  value,
  onChange,
  onRemoveItem,
  tierColors = TIER_COLORS,
  tileSize = 56,
  readOnly,
  className,
}: TierListProps) {
  const [mounted, setMounted] = React.useState(false);
  const zoneRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = React.useRef<{ id: string; offX: number; offY: number } | null>(null);
  const overRef = React.useRef<{ zone: string; index: number } | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [pointer, setPointer] = React.useState({ x: 0, y: 0 });
  const [over, setOver] = React.useState<{ zone: string; index: number } | null>(null);
  const dockX = useMotionValue(Number.POSITIVE_INFINITY);

  React.useEffect(() => setMounted(true), []);

  const allItems = React.useMemo(
    () => [...value.tiers.flatMap((t) => t.items), ...value.pool],
    [value],
  );
  const draggingItem = dragId ? allItems.find((i) => i.id === dragId) ?? null : null;

  const zoneOrder = React.useMemo(() => [...value.tiers.map((t) => t.id), POOL], [value.tiers]);

  const hitZone = (px: number, py: number): string | null => {
    for (const id of zoneOrder) {
      const el = zoneRefs.current[id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) return id;
    }
    return null;
  };

  const indexIn = (zoneId: string, px: number, py: number, skip: string): number => {
    const el = zoneRefs.current[zoneId];
    if (!el) return 0;
    const tiles = Array.from(el.querySelectorAll<HTMLElement>("[data-tile-id]")).filter(
      (t) => t.getAttribute("data-tile-id") !== skip,
    );
    for (let i = 0; i < tiles.length; i++) {
      const r = tiles[i].getBoundingClientRect();
      if (py < r.top) return i;
      if (py <= r.bottom && px < r.left + r.width / 2) return i;
    }
    return tiles.length;
  };

  const moveItem = (itemId: string, toZone: string, index: number) => {
    let moved: TierItem | undefined;
    const tiers = value.tiers.map((t) => {
      const idx = t.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return t;
      moved = t.items[idx];
      return { ...t, items: t.items.filter((i) => i.id !== itemId) };
    });
    let pool = value.pool;
    if (!moved) {
      const idx = pool.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        moved = pool[idx];
        pool = pool.filter((i) => i.id !== itemId);
      }
    }
    if (!moved) return;
    if (toZone === POOL) {
      const next = [...pool];
      next.splice(clamp(index, 0, next.length), 0, moved);
      pool = next;
    } else {
      const ti = tiers.findIndex((t) => t.id === toZone);
      if (ti !== -1) {
        const items = [...tiers[ti].items];
        items.splice(clamp(index, 0, items.length), 0, moved);
        tiers[ti] = { ...tiers[ti], items };
      }
    }
    onChange({ tiers, pool });
  };

  const setOverBoth = (next: { zone: string; index: number } | null) => {
    overRef.current = next;
    setOver(next);
  };

  const onTilePointerDown = (e: React.PointerEvent, itemId: string) => {
    if (readOnly || e.button !== 0) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = { id: itemId, offX: e.clientX - rect.left, offY: e.clientY - rect.top };
    setDragId(itemId);
    setPointer({ x: e.clientX, y: e.clientY });
    setOverBoth(null);
  };

  React.useEffect(() => {
    if (!dragId) return;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setPointer({ x: e.clientX, y: e.clientY });
      const zone = hitZone(e.clientX, e.clientY);
      setOverBoth(zone ? { zone, index: indexIn(zone, e.clientX, e.clientY, d.id) } : null);
    };
    const up = () => {
      const d = dragRef.current;
      const target = overRef.current;
      if (d && target) moveItem(d.id, target.zone, target.index);
      dragRef.current = null;
      setDragId(null);
      setOverBoth(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId]);

  const setLabel = (tierId: string, label: string) =>
    onChange({ ...value, tiers: value.tiers.map((t) => (t.id === tierId ? { ...t, label } : t)) });

  const addTier = () => {
    const color = tierColors[value.tiers.length % tierColors.length];
    onChange({ ...value, tiers: [...value.tiers, { id: uid(), label: "Nouveau", color, items: [] }] });
  };

  const moveTier = (tierId: string, dir: -1 | 1) => {
    const idx = value.tiers.findIndex((t) => t.id === tierId);
    const j = idx + dir;
    if (idx === -1 || j < 0 || j >= value.tiers.length) return;
    const tiers = [...value.tiers];
    [tiers[idx], tiers[j]] = [tiers[j], tiers[idx]];
    onChange({ ...value, tiers });
  };

  const removeTier = (tierId: string) => {
    const tier = value.tiers.find((t) => t.id === tierId);
    if (!tier) return;
    onChange({
      tiers: value.tiers.filter((t) => t.id !== tierId),
      pool: [...value.pool, ...tier.items],
    });
  };

  const renderTiles = (items: TierItem[], zoneId: string) => {
    const showIndicator = over?.zone === zoneId ? over.index : -1;
    const visible = items.filter((i) => i.id !== dragId);
    const captioned = allItems.some((i) => (i.image || i.emoji) && i.label);
    const indH = tileSize + (captioned ? CAPTION_H : 0);
    const out: React.ReactNode[] = [];
    visible.forEach((item, i) => {
      if (i === showIndicator) out.push(<Indicator key={`ind-${zoneId}`} size={tileSize} height={indH} />);
      out.push(
        <Tile
          key={item.id}
          item={item}
          size={tileSize}
          readOnly={readOnly}
          onRemove={onRemoveItem ? () => onRemoveItem(item.id) : undefined}
          onPointerDown={(e) => onTilePointerDown(e, item.id)}
        />,
      );
    });
    if (showIndicator >= visible.length)
      out.push(<Indicator key={`ind-${zoneId}-end`} size={tileSize} height={indH} />);
    return out;
  };

  const rowMinH = tileSize + CAPTION_H + 2;

  return (
    <div className={"select-none " + (className ?? "")}>
      <div className="overflow-hidden rounded-sm border border-zinc-200/80 bg-white shadow-[0_1px_3px_rgba(24,24,27,0.05)] transition-colors duration-200 dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_28px_70px_-32px_rgba(0,0,0,0.9)] dark:ring-1 dark:ring-white/[0.04]">
        {value.tiers.map((tier, ti) => (
          <motion.div
            key={tier.id}
            layout
            transition={SPRING}
            className="flex items-stretch border-b border-zinc-100 transition-colors duration-200 last:border-b-0 dark:border-white/[0.06]"
          >
            <div
              className="group/label relative flex w-[76px] shrink-0 items-center justify-center p-2 shadow-[inset_-1px_0_0_rgba(0,0,0,0.08)]"
              style={{ background: tier.color }}
            >
              <input
                value={tier.label}
                readOnly={readOnly}
                onChange={(e) => setLabel(tier.id, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                spellCheck={false}
                aria-label="Nom du tier"
                className="w-full bg-transparent text-center text-[18px] font-bold leading-tight tracking-tight text-white outline-none placeholder:text-white/60"
                style={{ minWidth: 0, textShadow: "0 1px 2px rgba(0,0,0,0.18)" }}
              />
              {!readOnly && (
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover/label:opacity-100">
                  <button
                    type="button"
                    aria-label="Monter le tier"
                    disabled={ti === 0}
                    onClick={() => moveTier(tier.id, -1)}
                    className="pointer-events-auto absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-sm bg-black/20 text-white hover:bg-black/40 disabled:opacity-25"
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 15l6-6 6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Descendre le tier"
                    disabled={ti === value.tiers.length - 1}
                    onClick={() => moveTier(tier.id, 1)}
                    className="pointer-events-auto absolute bottom-1.5 left-1.5 grid h-5 w-5 place-items-center rounded-sm bg-black/20 text-white hover:bg-black/40 disabled:opacity-25"
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {value.tiers.length > 1 && (
                    <button
                      type="button"
                      aria-label="Supprimer le tier"
                      onClick={() => removeTier(tier.id)}
                      className="pointer-events-auto absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-sm bg-black/20 text-white hover:bg-black/40"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            <div
              ref={(el) => {
                zoneRefs.current[tier.id] = el
              }}
              className={
                "flex flex-1 flex-wrap content-start items-start gap-2 p-2 transition-colors " +
                (over?.zone === tier.id ? "bg-zinc-100/70 dark:bg-zinc-800/60" : "")
              }
              style={{ minHeight: rowMinH }}
            >
              {renderTiles(tier.items, tier.id)}
            </div>
          </motion.div>
        ))}
      </div>

      {!readOnly && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={addTier}
            className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter une ligne
          </button>
        </div>
      )}

      <div
        className={
          "mt-3 rounded-sm border p-3 transition-colors duration-200 " +
          (over?.zone === POOL
            ? "border-zinc-300 bg-zinc-100/80 dark:border-white/20 dark:bg-zinc-800"
            : "border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-zinc-900 dark:ring-1 dark:ring-white/[0.04]")
        }
      >
        <div className="mb-2 flex items-center gap-1.5 px-0.5">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18" />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Non classés
          </span>
          <span className="grid h-4 min-w-4 place-items-center rounded-sm bg-zinc-200 px-1 text-[10px] font-semibold tabular-nums text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
            {value.pool.length}
          </span>
        </div>
        <div
          ref={(el) => {
            zoneRefs.current[POOL] = el
          }}
          onMouseMove={(e) => dockX.set(e.clientX)}
          onMouseLeave={() => dockX.set(Number.POSITIVE_INFINITY)}
          className="flex flex-wrap content-end gap-2"
          style={{ minHeight: tileSize + CAPTION_H }}
        >
          {value.pool.filter((i) => i.id !== dragId).length === 0 && over?.zone !== POOL && (
            <span className="px-1 py-3 text-[12px] text-zinc-400 dark:text-zinc-600">
              Tout est classé — glisse une tuile ici pour la déclasser
            </span>
          )}
          <DockContext.Provider value={readOnly || dragId ? null : dockX}>
            {renderTiles(value.pool, POOL)}
          </DockContext.Provider>
        </div>
      </div>

      {mounted &&
        draggingItem &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999]"
            style={{
              left: pointer.x - (dragRef.current?.offX ?? 0),
              top: pointer.y - (dragRef.current?.offY ?? 0),
            }}
          >
            <motion.div initial={{ scale: 1 }} animate={{ scale: 1.08, rotate: -4 }} transition={SPRING}>
              <TileFace item={draggingItem} size={tileSize} dragging />
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function Tile({
  item,
  size,
  readOnly,
  onRemove,
  onPointerDown,
}: {
  item: TierItem;
  size: number;
  readOnly?: boolean;
  onRemove?: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const mouseX = React.useContext(DockContext);
  return (
    <motion.div
      layout
      data-tile-id={item.id}
      transition={SPRING}
      onPointerDown={readOnly ? undefined : onPointerDown}
      className={
        "group/tile relative " + (readOnly ? "" : "cursor-grab active:cursor-grabbing")
      }
      style={{ touchAction: "none" }}
    >
      {mouseX ? (
        <DockMagnify mouseX={mouseX}>
          <TileFace item={item} size={size} />
        </DockMagnify>
      ) : (
        <TileFace item={item} size={size} />
      )}
      {!readOnly && onRemove && (
        <button
          type="button"
          aria-label={`Retirer ${item.label ?? ""}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 z-30 grid h-5 w-5 place-items-center rounded-sm border border-zinc-300 bg-white p-0 text-zinc-500 opacity-0 shadow-sm transition-opacity hover:text-zinc-900 group-hover/tile:opacity-100 focus-visible:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}

// macOS-dock magnification: tiles swell as the pointer nears, with a soft falloff to neighbors.
function DockMagnify({ mouseX, children }: { mouseX: MotionValue<number>; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val) => {
    const b = ref.current?.getBoundingClientRect();
    if (!b) return 9999;
    return val - (b.x + b.width / 2);
  });
  // Narrow falloff so only the tile directly under the pointer grows; neighbours stay put.
  const scaleSync = useTransform(distance, [-34, 0, 34], [1, 1.1, 1], { clamp: true });
  const scale = useSpring(scaleSync, { stiffness: 320, damping: 32, mass: 0.5 });
  const zIndex = useTransform(scale, (s) => (s > 1.02 ? 20 : 0));
  return (
    <motion.div ref={ref} style={{ scale, zIndex, transformOrigin: "bottom center", position: "relative" }}>
      {children}
    </motion.div>
  );
}

function TileFace({ item, size, dragging }: { item: TierItem; size: number; dragging?: boolean }) {
  const hasMedia = Boolean(item.image || item.emoji);
  return (
    <div
      className={
        "flex select-none flex-col overflow-hidden rounded-sm bg-white ring-1 ring-zinc-200/80 transition-colors duration-200 dark:bg-zinc-800 dark:ring-zinc-700 " +
        (dragging
          ? "shadow-[0_22px_38px_-12px_rgba(24,24,27,0.45)] ring-zinc-300 dark:ring-zinc-600"
          : "shadow-[0_1px_2px_rgba(24,24,27,0.06)]")
      }
      style={{ width: size }}
    >
      <div className="flex items-center justify-center overflow-hidden" style={{ width: size, height: size }}>
        {item.image ? (
          <img src={item.image} alt={item.label ?? ""} className="h-full w-full object-cover" draggable={false} />
        ) : item.emoji ? (
          <span style={{ fontSize: size * 0.44, lineHeight: 1 }}>{item.emoji}</span>
        ) : (
          <span className="px-1 text-center text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
            {item.label}
          </span>
        )}
      </div>
      {hasMedia && item.label && (
        <div className="truncate border-t border-zinc-100 px-1 py-1 text-center text-[10.5px] font-semibold leading-none text-zinc-700 transition-colors duration-200 dark:border-zinc-700/70 dark:text-zinc-200">
          {item.label}
        </div>
      )}
    </div>
  );
}

function Indicator({ size, height }: { size: number; height: number }) {
  return (
    <motion.span
      layout
      aria-hidden
      className="shrink-0 rounded-sm border-2 border-dashed border-zinc-300 bg-zinc-200/40 dark:border-zinc-600 dark:bg-zinc-700/40"
      style={{ width: size, height }}
    />
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), Math.max(min, max));
}
