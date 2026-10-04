import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

/**
 * Accessible dropdown in the liquid-glass style.
 *  - options: string[] or { value, label, hint? }[]
 *  - the list renders in a portal, so it is never clipped by a card
 *  - desktop: popover under the button (flips above when there is no room)
 *  - phones: bottom sheet with a large touch-friendly list
 *  - keyboard: Arrow keys, Home/End, Enter/Space, Escape, type-to-search
 */
const normalize = (options) =>
  options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

export default function GlassSelect({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  searchable = false,
  invalid = false,
  disabled = false,
  ariaLabel,
}) {
  const autoId = useId();
  const baseId = id || autoId;
  const items = useMemo(() => normalize(options), [options]);
  const selected = items.find((o) => o.value === value) || null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const [sheet, setSheet] = useState(false);

  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((o) => `${o.label} ${o.hint || ""}`.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const place = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const isSheet = window.innerWidth < 640;
    setSheet(isSheet);
    if (isSheet) return setPos(null);

    const r = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - 12;
    const spaceAbove = r.top - 12;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, Math.min(340, openUp ? spaceAbove : spaceBelow));
    setPos({
      left: r.left,
      width: r.width,
      maxHeight,
      ...(openUp ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
    });
  }, []);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setQuery("");
    if (refocus) buttonRef.current?.focus();
  }, []);

  const choose = useCallback(
    (item) => {
      onChange(item.value);
      close();
    },
    [onChange, close]
  );

  const openList = () => {
    if (disabled) return;
    const idx = filtered.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    place();
    setOpen(true);
  };

  // Reposition / outside-click / lock scroll for the sheet.
  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    const onResize = () => place();
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      close(false);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    document.addEventListener("pointerdown", onDown);
    const prevOverflow = document.body.style.overflow;
    if (window.innerWidth < 640) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      document.removeEventListener("pointerdown", onDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, place, close]);

  useEffect(() => {
    if (!open) return;
    (searchable && !sheet ? searchRef : panelRef).current?.focus({ preventScroll: true });
  }, [open, searchable, sheet]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onPanelKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(filtered.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  const onButtonKeyDown = (e) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  };

  const panel = (
    <div
      ref={panelRef}
      tabIndex={-1}
      onKeyDown={onPanelKeyDown}
      className={
        sheet
          ? "glass-strong fixed inset-x-0 bottom-0 z-[90] flex max-h-[72dvh] flex-col rounded-t-3xl bg-ink-900/90 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] outline-none"
          : "glass-strong fixed z-[90] flex flex-col rounded-2xl bg-ink-900/85 outline-none"
      }
      style={sheet || !pos ? undefined : { left: pos.left, width: pos.width, maxHeight: pos.maxHeight, top: pos.top, bottom: pos.bottom }}
    >
      {sheet && <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20" aria-hidden="true" />}

      {searchable && (
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-mist-500" aria-hidden="true" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search…"
            aria-label="Search options"
            className="w-full bg-transparent text-sm text-mist-100 placeholder:text-mist-600 focus:outline-none"
          />
        </div>
      )}

      <ul
        ref={listRef}
        role="listbox"
        id={`${baseId}-list`}
        aria-label={ariaLabel || placeholder}
        className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
      >
        {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-mist-500">No matches</li>}
        {filtered.map((o, i) => {
          const isSel = o.value === value;
          return (
            <li
              key={o.value}
              role="option"
              aria-selected={isSel}
              data-index={i}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(o)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors sm:py-2 ${
                i === active ? "bg-white/10 text-white" : "text-mist-200"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">{o.label}</span>
                {o.hint && <span className="block truncate text-xs text-mist-500">{o.hint}</span>}
              </span>
              {isSel && <Check className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-list` : undefined}
        aria-invalid={invalid || undefined}
        className="field-input flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={`min-w-0 truncate ${selected ? "text-mist-100" : "text-mist-600"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-mist-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open &&
        createPortal(
          <>
            {sheet && <div className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm" aria-hidden="true" />}
            {panel}
          </>,
          document.body
        )}
    </>
  );
}
