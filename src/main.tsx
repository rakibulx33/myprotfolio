import { createRoot, hydrateRoot } from "react-dom/client";
import "@fontsource-variable/instrument-sans/wdth.css";
import "@fontsource-variable/martian-mono/wdth.css";
import "./styles.css";
import Portfolio from "./Portfolio";

const root = document.getElementById("root")!;
// Production HTML is prerendered (scripts/prerender.mjs), so hydrate it; dev starts empty.
if (root.hasChildNodes()) hydrateRoot(root, <Portfolio />);
else createRoot(root).render(<Portfolio />);
