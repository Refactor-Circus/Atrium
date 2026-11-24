/**
 * The deck's cursor spotlight (D-078): one passive pointer listener for the
 * whole app sets `--mx`/`--my` (the pointer, in px) on the panel or figure
 * under it, which atrium.css draws as a soft radial light. One write per
 * animation frame; nothing runs while the user asks for reduced motion or on
 * touch input.
 */
export function installSpotlight(): void {
  if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  let frame = 0
  let last: PointerEvent | null = null

  function paint() {
    frame = 0

    const target = last?.target instanceof Element ? last.target.closest<HTMLElement>('.atrium-card, .atrium-stat') : null

    if (!target || !last) {
      return
    }

    const box = target.getBoundingClientRect()

    target.style.setProperty('--mx', `${Math.round(last.clientX - box.left)}px`)
    target.style.setProperty('--my', `${Math.round(last.clientY - box.top)}px`)
  }

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') {
      return
    }

    last = event
    frame ||= requestAnimationFrame(paint)
  }, { passive: true })
}
