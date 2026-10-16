import { useLayoutEffect, useRef } from "react";
import { bindSpacingHandle } from "../../DS1/2-core/spacing-handle";
export type BoxRegion = "margin" | "border" | "padding" | "content" | "all";
export type BoxModelConfig = {
  paddingX: number; paddingY: number; radius: number;
  borderTop?: number; borderRight?: number; borderBottom?: number; borderLeft?: number;
  marginTop?: number; marginRight?: number; marginBottom?: number; marginLeft?: number;
};
const BORDER_FIELDS = { top: "borderTop", right: "borderRight", bottom: "borderBottom", left: "borderLeft" } as const;
const MARGIN_FIELDS = { top: "marginTop", right: "marginRight", bottom: "marginBottom", left: "marginLeft" } as const;
const clampSpacing = (value: number) => Math.min(96, Math.max(0, value));
const clampBorder = (value: number) => Math.min(24, Math.max(0, value));

function ScrubbableBoxValue(props: {
  ariaLabel: string; className: string; disabled?: boolean; max: number; min: number;
  step: number; value: number; onValueChange: (value: number) => void; onPreview?: (value: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(props); latest.current = props;
  useLayoutEffect(() => bindSpacingHandle(input.current!, () => ({
    value: latest.current.value, min: latest.current.min, max: latest.current.max,
    step: latest.current.step, gain: latest.current.step / 6, disabled: latest.current.disabled,
    snapPreview: true, keyboard: false,
    onPreview: value => (latest.current.onPreview ?? latest.current.onValueChange)(value),
    onCommit: value => latest.current.onValueChange(value),
    onTap: () => { input.current?.focus(); input.current?.select(); },
  })), []);
  return <input ref={input} aria-label={props.ariaLabel} className={props.className} type="number"
    disabled={props.disabled} min={props.min} max={props.max} step={props.step} value={props.value}
    onChange={event => props.onValueChange(Math.min(props.max, Math.max(props.min, Number(event.target.value))))} />;
}

export function BoxModel({
  config,
  contentSize,
  hoverRegion,
  onChange,
  onPreview,
  onHoverRegion,
  supportsSpacing,
}: {
  config: BoxModelConfig;
  contentSize: { height: number; width: number };
  hoverRegion: BoxRegion | null;
  onChange: (patch: Partial<BoxModelConfig>) => void;
  onPreview?: (patch: Partial<BoxModelConfig>) => void;
  onHoverRegion: (region: BoxRegion | null) => void;
  supportsSpacing: boolean;
}) {
  const paddingX = supportsSpacing ? Math.round(config.paddingX) : 0;
  const paddingY = supportsSpacing ? Math.round(config.paddingY) : 0;

  const paddingInput = (
    axis: "x" | "y",
    position: "top" | "right" | "bottom" | "left",
  ) => {
    const value = axis === "x" ? paddingX : paddingY;

    return (
      <ScrubbableBoxValue
        ariaLabel={`Padding ${position}`}
        className={`box-model__value box-model__value--${position}`}
        disabled={!supportsSpacing}
        max={96}
        min={0}
        onPreview={onPreview ? (nextValue) => onPreview({ [axis === "x" ? "paddingX" : "paddingY"]: clampSpacing(nextValue) }) : undefined}
        onValueChange={(nextValue) =>
          onChange({
            [axis === "x" ? "paddingX" : "paddingY"]:
              clampSpacing(nextValue),
          })
        }
        step={4}
        value={value}
      />
    );
  };

  const radiusInput = (
    position: "top-left" | "top-right" | "bottom-right" | "bottom-left",
  ) => (
    <ScrubbableBoxValue
      ariaLabel={`Border radius ${position}`}
      className={`box-model__value box-model__radius-value box-model__radius-value--${position}`}
      max={48}
      min={0}
      onPreview={onPreview ? (radius) => onPreview({ radius: clampSpacing(radius) }) : undefined}
      onValueChange={(radius) => onChange({ radius: clampSpacing(radius) })}
      step={1}
      value={Math.round(config.radius)}
    />
  );

  const borderInput = (position: "top" | "right" | "bottom" | "left") => {
    const field = BORDER_FIELDS[position];

    return (
      <ScrubbableBoxValue
        ariaLabel={`Border ${position}`}
        className={`box-model__value box-model__value--${position}`}
        max={24}
        min={0}
        onPreview={onPreview ? (nextValue) => onPreview({ [field]: clampBorder(nextValue) }) : undefined}
        onValueChange={(nextValue) =>
          onChange({ [field]: clampBorder(nextValue) })
        }
        step={1}
        value={config[field] ?? 0}
      />
    );
  };

  const marginInput = (position: "top" | "right" | "bottom" | "left") => {
    const field = MARGIN_FIELDS[position];

    return (
      <ScrubbableBoxValue
        ariaLabel={`Margin ${position}`}
        className={`box-model__value box-model__value--${position}`}
        max={96}
        min={0}
        onPreview={onPreview ? (nextValue) => onPreview({ [field]: clampSpacing(nextValue) }) : undefined}
        onValueChange={(nextValue) =>
          onChange({ [field]: clampSpacing(nextValue) })
        }
        step={4}
        value={config[field] ?? 0}
      />
    );
  };

  const handleRegionHover = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-region]",
    );
    onHoverRegion((target?.dataset.region as BoxRegion | undefined) ?? null);
  };

  return (
    <div
      aria-label="Box model"
      className="box-model"
      data-hover={hoverRegion ?? undefined}
      data-region="margin"
      onMouseLeave={() => onHoverRegion(null)}
      onMouseOver={handleRegionHover}
    >
      <span className="box-model__label">margin</span>
      {marginInput("top")}
      {marginInput("right")}
      {marginInput("bottom")}
      {marginInput("left")}

      <div className="box-model__border" data-region="border">
        <span className="box-model__label">border</span>
        {radiusInput("top-left")}
        {radiusInput("top-right")}
        {radiusInput("bottom-right")}
        {radiusInput("bottom-left")}
        {borderInput("top")}
        {borderInput("right")}
        {borderInput("bottom")}
        {borderInput("left")}

        <div className="box-model__padding" data-region="padding">
          <span className="box-model__label">padding</span>
          {paddingInput("y", "top")}
          {paddingInput("x", "right")}
          {paddingInput("y", "bottom")}
          {paddingInput("x", "left")}
          <div className="box-model__content" data-region="content">
            {contentSize.width}×{contentSize.height}
          </div>
        </div>
      </div>
    </div>
  );
}

