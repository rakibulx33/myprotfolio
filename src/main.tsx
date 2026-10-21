import { createRoot } from "react-dom/client";
import "@fontsource-variable/martian-mono/wdth.css";
import "@fontsource-variable/instrument-sans";
import "./styles.css";
import Portfolio from "./Portfolio";

createRoot(document.getElementById("root")!).render(<Portfolio />);
