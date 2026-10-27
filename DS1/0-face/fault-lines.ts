import type { Finding } from './constraints';

const tolerance = 1;
const near = (a: number, b: number) => Math.abs(a - b) <= tolerance;
const style = (el: Element) => el.ownerDocument.defaultView!.getComputedStyle(el);
const visible = (el: Element) => {
  const box = el.getBoundingClientRect();
  return box.width > 0 && box.height > 0 && style(el).visibility !== 'hidden' && style(el).display !== 'none';
};

/** Walk each open shadow tree once; slotted children already occur in the light tree. */
function elements(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll('*')).flatMap(el => [el, ...(el.shadowRoot ? elements(el.shadowRoot) : [])]);
}

type Grid = { element: Element; family: string | null; axis: 'x' | 'y'; lines: number[]; gaps: number[]; crossGap?: number; internalDrift: boolean; start: number; end: number };

/** Related grids opt in by name; unlabelled card grids are candidates for human review. */
export function faultLineGrids(root: ParentNode): Grid[] {
  return elements(root).flatMap(element => {
    const family = element.getAttribute('data-ds-fault-lines');
    if (family === 'off' || !visible(element)) return [];
    const children = Array.from(element.children).filter(visible);
    if (!children.length) return [];
    if (family === null && (!/grid/.test(style(element).display) || children.length < 2 ||
      !children.every(child => child.matches('ds-card, .ds-card, ds-button, button')))) return [];
    const axis = element.getAttribute('data-ds-fault-axis') === 'y' ? 'y' : 'x';
    const boxes = children.map(child => child.getBoundingClientRect());
    const crossStart = (box: DOMRect) => axis === 'x' ? box.top : box.left;
    const crossEnd = (box: DOMRect) => axis === 'x' ? box.bottom : box.right;
    const start = (box: DOMRect) => axis === 'x' ? box.left : box.top;
    const end = (box: DOMRect) => axis === 'x' ? box.right : box.bottom;
    const bands: DOMRect[][] = [];
    for (const box of boxes.sort((a,b) => crossStart(a)-crossStart(b))) {
      const band = bands.find(row => near(crossStart(row[0]!), crossStart(box)));
      if (band) band.push(box); else bands.push([box]);
    }
    // The fullest band defines the tracks; an incomplete final row is valid.
    const band = [...bands].sort((a,b) => b.length-a.length)[0]!.sort((a,b) => start(a)-start(b));
    const lines = band.flatMap(box => [start(box), end(box)]);
    const gaps = band.slice(1).map((box,index) => start(box)-end(band[index]!));
    const crossGaps = bands.slice(1).map((row,index) => Math.min(...row.map(crossStart))-Math.max(...bands[index]!.map(crossEnd)));
    const internalDrift = bands.some(row => row.length === band.length && row.slice().sort((a,b)=>start(a)-start(b)).some((box,index)=>!near(start(box),lines[index*2]!) || !near(end(box),lines[index*2+1]!))) || crossGaps.some(gap=>!near(gap,crossGaps[0]!));
    return [{element, family, axis, lines, gaps, crossGap: crossGaps[0], internalDrift, start: lines[0]!, end: lines.at(-1)!}];
  });
}

/** Fault lines compare rendered tracks across separate sections, in the current viewport. */
export function inspectFaultLines(root: ParentNode): Finding[] {
  const grids = faultLineGrids(root);
  const findings: Finding[] = [];
  for (let i = 0; i < grids.length; i++) {
    const current = grids[i]!;
    if (current.internalDrift) findings.push({element:current.element, ...(current.family === null ? {review:true} : {}), message:`Fault lines at ${current.element.ownerDocument.documentElement.clientWidth}px: tracks or repeated gaps drift inside ${current.family || 'this card grid'}. Align its complete rows and repeated spacing.`});
    const reference = grids.slice(0,i).find(other => {
      if (other.axis !== current.axis || other.lines.length !== current.lines.length) return false;
      if (current.family !== null || other.family !== null) return current.family !== null && current.family === other.family;
      return near(current.start,other.start) && near(current.end,other.end);
    });
    if (!reference) continue;
    const drift = current.lines.map((line,index) => Math.abs(line-reference.lines[index]!));
    const gapDrift = current.gaps.some((gap,index) => !near(gap,reference.gaps[index]!));
    const rowDrift = current.crossGap !== undefined && reference.crossGap !== undefined && !near(current.crossGap,reference.crossGap);
    if (!drift.some(value => value > tolerance) && !gapDrift && !rowDrift) continue;
    const width = current.element.ownerDocument.documentElement.clientWidth;
    const review = current.family === null;
    findings.push({element: current.element, ...(review ? {review:true} : {}), message:
      `Fault lines at ${width}px: ${current.family || 'these card grids'} ${review ? 'may be related but have' : 'have'} misaligned ${current.axis === 'x' ? 'column' : 'row'} edges or unequal gaps (edge drift ${Math.round(Math.max(...drift))}px; gaps ${current.gaps.map(Math.round).join('/')}px versus ${reference.gaps.map(Math.round).join('/')}px${rowDrift ? `; cross-axis gap ${Math.round(current.crossGap!)}px versus ${Math.round(reference.crossGap!)}px` : ''}). ${review ? 'Name the related groups with data-ds-fault-lines to enforce alignment, or mark an intentional exception off.' : 'Use the same tracks and gap for this family at this viewport.'}`});
  }
  return findings;
}
