import { useCallback, useEffect, useRef } from "react";

/**
 * Warns the user before leaving the page when there are unsaved changes.
 *
 * Pass `deps` to auto-mark dirty whenever those values change (after mount).
 * For forms where data loads asynchronously, omit `deps` and call `markDirty()`
 * manually from onChange/mutation handlers instead.
 *
 * Always call `clearDirty()` before intentional navigation or after a
 * successful save so the browser prompt does not block the next action.
 */
export function useUnsavedChangesGuard(deps: unknown[] = []) {
  const isDirtyRef = useRef(false);
  const mountedRef = useRef(false);

  // Auto-mark dirty when watched values change after the initial mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    isDirtyRef.current = true;
  }, deps);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const markDirty = useCallback(() => { isDirtyRef.current = true; }, []);
  const clearDirty = useCallback(() => { isDirtyRef.current = false; }, []);
  return { markDirty, clearDirty };
}
