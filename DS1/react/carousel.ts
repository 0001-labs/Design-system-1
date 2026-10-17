/** A carousel in React: the slides stay in the light DOM, so they render on
 * the server and read in tests; ds-carousel snaps them, draws the dots and
 * buttons and announces the slide in view. The region and its name are in the
 * markup from the first render. Browser-only registration of ds-carousel stays
 * in the product's runtime entry. */
import { createElement as h, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import type { Carousel as CarouselElement, CarouselChangeDetail } from "../3-unit/ds-carousel";

export type { CarouselChangeDetail } from "../3-unit/ds-carousel";
export type CarouselProps = Omit<HTMLAttributes<CarouselElement>, "onChange"> & {
  /** The region's name: what the slides show. */
  label: string;
  /** The slide in view, from 0. Changing it scrolls there. */
  current?: number;
  /** Show previous and next buttons beside the dots. */
  buttons?: boolean;
  /** Show the dots; on by default. */
  dots?: boolean;
  /** Draw the last dot as an end marker. */
  end?: boolean;
  /** Each slide's width in whole squares; the carousel's own width when not set. */
  slideWidth?: number;
  /** Squares between slides; one by default. */
  gap?: number;
  /** A person moved to another slide. */
  onChange?: (index: number, previous: number) => void;
  children?: ReactNode;
};

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const Carousel = forwardRef<CarouselElement, CarouselProps>(function Carousel(
  { label, current, buttons, dots = true, end, slideWidth, gap, onChange, children, ...props }, ref,
) {
  const host = useRef<CarouselElement | null>(null);
  useCommitEffect(() => {
    const element = host.current;
    if (!element || !onChange) return;
    const change = (event: Event) => {
      if (event.target !== element) return;
      const { index, previous } = (event as CustomEvent<CarouselChangeDetail>).detail;
      onChange(index, previous);
    };
    element.addEventListener("change", change);
    return () => element.removeEventListener("change", change);
  });
  return h("ds-carousel", {
    role: "region",
    "aria-label": label,
    ...props,
    label,
    literal: true,
    current,
    buttons: buttons || undefined,
    "no-dots": dots ? undefined : true,
    end: end || undefined,
    "slide-width": slideWidth,
    gap,
    ref: (element: CarouselElement | null) => {
      host.current = element;
      if (typeof ref === "function") ref(element); else if (ref) ref.current = element;
    },
  }, children);
});
