import React from "react";
import { BorderBeam as BaseBorderBeam } from "border-beam";

/**
 * Custom Mint & Neon Greens conic gradient override.
 * Uses the project's signature mint (#61F1AC) and complementary neon greens,
 * completely avoiding rainbow cycling.
 */
const MINT_BEAM_CSS = `
[data-beam="{id}"][data-active]::after,
[data-beam="{id}"][data-fading]::after {
  background: conic-gradient(
    from var(--beam-angle-{id}),
    transparent 0%, transparent 54%,
    rgba(97, 241, 172, 0.12) 58%,
    rgba(46, 229, 157, 0.45) 63%,
    rgba(78, 237, 164, 0.85) 67%,
    #61F1AC 70%,
    #C2FFDF 71.2%,
    #61F1AC 72.4%,
    rgba(46, 229, 157, 0.85) 75%,
    rgba(34, 197, 94, 0.45) 79%,
    rgba(97, 241, 172, 0.15) 83%,
    transparent 87%
  ), radial-gradient(ellipse at 50% 50%, rgba(97, 241, 172, 0.25), transparent 70%) !important;
}

[data-beam="{id}"] [data-beam-bloom] {
  background: conic-gradient(
    from var(--beam-angle-{id}),
    transparent 0%, transparent 52%,
    rgba(97, 241, 172, 0.2) 60%,
    #61F1AC 69%,
    #C2FFDF 71%,
    #61F1AC 73%,
    rgba(46, 229, 157, 0.6) 77%,
    rgba(97, 241, 172, 0.2) 81%,
    transparent 87%
  ) !important;
  filter: blur(8px) brightness(1.3) saturate(1.4) !important;
}

[data-beam="{id}"][data-active]::before,
[data-beam="{id}"][data-fading]::before {
  background: radial-gradient(ellipse at 50% 50%, rgba(97, 241, 172, 0.15), transparent 70%) !important;
  box-shadow: inset 0 0 6px 1px rgba(97, 241, 172, 0.2) !important;
}
`;

/**
 * BorderBeam component tailored for the rate. color system:
 * - Default colorVariant is 'mint' (#61F1AC + neon greens).
 * - Disables rainbow hue-shift cycles (staticColors=true for mint).
 */
export function BorderBeam({
  colorVariant = "mint",
  staticColors,
  css,
  ...props
}) {
  const isMint = colorVariant === "mint" || colorVariant === "neon-green";
  const mergedCss = isMint
    ? `${MINT_BEAM_CSS}\n${css || ""}`
    : css;

  return (
    <BaseBorderBeam
      colorVariant={isMint ? "forest" : colorVariant}
      staticColors={isMint ? true : (staticColors ?? false)}
      css={mergedCss}
      {...props}
    />
  );
}

export default BorderBeam;
