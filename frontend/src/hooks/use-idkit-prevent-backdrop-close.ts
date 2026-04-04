'use client';

import { useEffect } from 'react';

/**
 * IDKit closes its modal when clicking the dimmed `.idkit-backdrop` (see @worldcoin/idkit).
 * Intercept capture-phase clicks on the backdrop so only the close button (inside `.idkit-modal`) dismisses.
 */
export function useIdkitPreventBackdropClose(open: boolean): void {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const onClickCapture = (e: MouseEvent) => {
      const path = e.composedPath();
      let inModal = false;
      let inBackdrop = false;
      for (const node of path) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.classList?.contains('idkit-modal')) {
          inModal = true;
          break;
        }
        if (node.classList?.contains('idkit-backdrop')) {
          inBackdrop = true;
        }
      }
      if (inBackdrop && !inModal) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    document.addEventListener('click', onClickCapture, true);
    return () => document.removeEventListener('click', onClickCapture, true);
  }, [open]);
}
