// happy-dom has no `window.confirm()`. The pages ask it before a destructive
// call, and their tests spy on it (`vi.spyOn(window, 'confirm')`), so every
// test file starts with one that declines.
if (typeof window !== 'undefined' && typeof window.confirm !== 'function') {
  window.confirm = () => false
}
