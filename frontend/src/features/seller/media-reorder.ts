function animateMediaReorder(container: HTMLElement | null, reorder: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reorder();
    return;
  }
  const elements = Array.from(container?.querySelectorAll<HTMLElement>("[data-media-key]") ?? []);
  const before = new Map(elements.map((element) => [element.dataset.mediaKey!, element.getBoundingClientRect()]));
  reorder();
  window.requestAnimationFrame(() => {
    for (const element of container?.querySelectorAll<HTMLElement>("[data-media-key]") ?? []) {
      const previous = before.get(element.dataset.mediaKey ?? "");
      if (!previous) continue;
      const current = element.getBoundingClientRect();
      const x = previous.left - current.left;
      const y = previous.top - current.top;
      if (!x && !y) continue;
      element.animate([{ transform: `translate(${x}px, ${y}px)` }, { transform: "translate(0, 0)" }], {
        duration: 240,
        easing: "cubic-bezier(.2, .75, .25, 1)",
      });
    }
  });
}

function reorderItem<T>(items: T[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export { animateMediaReorder, reorderItem };
