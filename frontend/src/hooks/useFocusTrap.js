import { useEffect } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Traps keyboard focus inside `ref` while `active`, focuses the first element on
// open, closes on Escape, and restores focus to the previously-focused element
// on close. Makes modals/dialogs keyboard-accessible.
export default function useFocusTrap(ref, active, onClose) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const previouslyFocused = document.activeElement;

    const focusables = () =>
      Array.from(el.querySelectorAll(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null
      );

    // Focus the first focusable element in the dialog.
    const firstFocus = focusables()[0];
    if (firstFocus) firstFocus.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => {
      el.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [active, ref, onClose]);
}
