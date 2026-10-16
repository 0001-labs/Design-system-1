import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../DS1/1-root/one.css";
import "../../DS1/2-core/ds-icon";
import "./app.css";
import "./docs-embed.css";
import "./shell.css";
import "../../DS1/0-face/grid";
import { startScaling } from "../../DS1/0-face/scaling";
import { initializeDocsEmbed } from "./lib/docsEmbed";
import { Root } from "./Root";

// Every screen, the dashboard and the font workspace included, scales as Design system 1 does:
// 1 on a computer, the width over 280 on a phone or tablet.
startScaling();
initializeDocsEmbed();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
