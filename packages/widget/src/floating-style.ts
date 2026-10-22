// Web Component-only placement; the shared Vue / React stylesheet stays inline.
export const floatingStyleText = `
.acw-dock, .acw-remote-panel {
  display: contents;
}

.acw-remote-toggle[hidden], .acw-remote-panel[hidden] {
  display: none;
}

:host([data-ac-placement="top-left"]),
:host([data-ac-placement="top-right"]) {
  position: fixed;
  top: max(16px, env(safe-area-inset-top));
  width: min(320px, calc(100vw - 32px));
  z-index: var(--acw-floating-z-index, 1000);
  pointer-events: none;
}

:host([data-ac-placement="top-left"]) {
  left: max(16px, env(safe-area-inset-left));
}

:host([data-ac-placement="top-right"]) {
  right: max(16px, env(safe-area-inset-right));
}

/* A filter on the root would make the fixed dock follow the unit, not the viewport. */
:host([data-ac-placement^="top-"]) .acw-root {
  filter: none;
}

:host([data-ac-placement^="top-"]) .acw-shell {
  /* Only the visible housing is interactive; airflow must not cover the page. */
  pointer-events: auto;
}

:host([data-ac-placement^="top-"]) .acw-dock {
  position: fixed;
  bottom: max(16px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 8px;
  max-width: calc(100vw - 32px);
  pointer-events: none;
}

:host([data-ac-placement="top-left"]) .acw-dock {
  left: max(16px, env(safe-area-inset-left));
  align-items: flex-start;
}

:host([data-ac-placement="top-right"]) .acw-dock {
  right: max(16px, env(safe-area-inset-right));
}

:host([data-ac-placement^="top-"]) .acw-remote-panel:not([hidden]) {
  pointer-events: auto;
  display: block;
  max-height: calc(100vh - 96px);
  max-height: calc(100dvh - 96px);
  overflow: auto;
  padding: 8px;
}

:host([data-ac-placement^="top-"]) .acw-remote {
  margin: 0;
}

.acw-remote-toggle {
  pointer-events: auto;
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid var(--acw-border-color);
  border-radius: 24px;
  background: #fff;
  color: #141414;
  box-shadow: 0 2px 12px #0002;
  font: inherit;
  cursor: pointer;
}

.acw-remote-toggle:focus-visible {
  outline: 2px solid #0284c7;
  outline-offset: 3px;
}

@media (prefers-color-scheme: dark) {
  .acw-remote-toggle {
    background: #252a31;
    color: #fafafa;
  }
}
`
