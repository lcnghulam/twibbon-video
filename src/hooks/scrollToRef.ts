import { RefObject } from "react";

export function useScrollToRef() {
  const scrollToRef = (
    ref: RefObject<HTMLElement | null>,
    offset: number = 0,
    behavior: ScrollBehavior = "smooth"
  ) => {
    if (ref.current) {
      const y = ref.current.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior });
    }
  };

  return scrollToRef;
}
