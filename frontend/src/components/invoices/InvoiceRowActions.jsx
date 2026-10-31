import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Copy,
  ArrowRightLeft,
  FileMinus,
  FilePlus,
  Receipt,
  Send,
  Download,
  Printer,
  Repeat,
  Check,
} from "lucide-react";
import { THEME_OPTIONS } from "./InvoiceTemplate";

const Item = ({ icon: Icon, iconClass = "", onClick, danger, selected, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
      danger
        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15"
        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40"
    }`}
  >
    {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${iconClass}`} />}
    <span className="flex-1">{children}</span>
    {selected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
  </button>
);

// Per-row "three-dot" actions menu. Positioned with fixed coordinates computed
// from the trigger so it is never clipped by the scrollable table container,
// and flips upward near the bottom of the viewport.
const InvoiceRowActions = ({
  invoice,
  statusLoading,
  onToggleStatus,
  onReminder,
  onOpen,
  onDelete,
  onDuplicate,
  onConvert,
  onCreditNote,
  onDebitNote,
  onReceipt,
  onSend,
  onDownloadPdf,
  onPrint,
  onMakeRecurring,
  onThemeChange,
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 12;
    const spaceBelow = window.innerHeight - r.bottom - margin;
    const spaceAbove = r.top - margin;
    // Open toward whichever side has more room, and cap height to that space.
    const openUp = spaceAbove > spaceBelow;
    setPos({
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      right: window.innerWidth - r.right,
      maxHeight: Math.max(160, openUp ? spaceAbove : spaceBelow),
    });
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open) place();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onReflow = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open]);

  const run = (fn) => (e) => {
    e.stopPropagation();
    setOpen(false);
    fn();
  };

  const isPaid = invoice.status === "Paid";

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`p-2 rounded-lg transition-colors cursor-pointer ${
          open
            ? "bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200"
            : "hover:bg-slate-100 dark:hover:bg-slate-700/40 text-slate-500 dark:text-slate-400"
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: pos.top,
            bottom: pos.bottom,
            right: pos.right,
            maxHeight: pos.maxHeight,
          }}
          className="w-48 overflow-y-auto overscroll-contain bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 py-1 z-[60] animate-slide-down origin-top"
        >
          <Item icon={Edit} onClick={run(onOpen)}>
            Open
          </Item>
          <Item
            icon={statusLoading ? Loader2 : isPaid ? RotateCcw : CheckCircle2}
            iconClass={
              statusLoading
                ? "animate-spin"
                : isPaid
                ? "text-amber-500"
                : "text-emerald-500"
            }
            onClick={run(onToggleStatus)}
          >
            {isPaid ? "Mark as unpaid" : "Mark as paid"}
          </Item>
          {onSend && (
            <Item icon={Send} iconClass="text-blue-500" onClick={run(onSend)}>
              Send
            </Item>
          )}
          {onDownloadPdf && (
            <Item icon={Download} onClick={run(onDownloadPdf)}>
              Download PDF
            </Item>
          )}
          {onPrint && (
            <Item icon={Printer} onClick={run(onPrint)}>
              Print
            </Item>
          )}
          {!isPaid && (
            <Item icon={Mail} iconClass="text-blue-500" onClick={run(onReminder)}>
              Generate reminder
            </Item>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

          {onMakeRecurring && (
            <Item icon={Repeat} onClick={run(onMakeRecurring)}>
              Make Recurring
            </Item>
          )}
          {onDuplicate && (
            <Item icon={Copy} onClick={run(onDuplicate)}>
              Duplicate
            </Item>
          )}
          {onConvert && ["estimate", "proforma"].includes(invoice.type) && (
            <Item icon={ArrowRightLeft} onClick={run(onConvert)}>
              Convert to Invoice
            </Item>
          )}
          {(invoice.type || "invoice") === "invoice" && (
            <>
              {onCreditNote && (
                <Item icon={FileMinus} onClick={run(onCreditNote)}>
                  Credit Note
                </Item>
              )}
              {onDebitNote && (
                <Item icon={FilePlus} onClick={run(onDebitNote)}>
                  Debit Note
                </Item>
              )}
              {onReceipt && (
                <Item icon={Receipt} onClick={run(onReceipt)}>
                  Receipt
                </Item>
              )}
            </>
          )}

          {onThemeChange && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              <p className="px-3 pt-1 pb-0.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Theme
              </p>
              {THEME_OPTIONS.map((opt) => (
                <Item
                  key={opt.value}
                  selected={(invoice.theme || "classic") === opt.value}
                  onClick={run(() => onThemeChange(opt.value))}
                >
                  {opt.label}
                </Item>
              ))}
            </>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <Item icon={Trash2} danger onClick={run(onDelete)}>
            Delete
          </Item>
        </div>,
        document.body
      )}
    </>
  );
};

export default InvoiceRowActions;
