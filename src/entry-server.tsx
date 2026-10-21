import { renderToString } from "react-dom/server";
import Portfolio from "./Portfolio";

// Used at build time by scripts/prerender.mjs to put the real page HTML into dist/index.html.
export function render() {
  return renderToString(<Portfolio />);
}
