import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../DS1/1-root/one.css";
import "../../DS1/2-core/ds-icon";
import "./app.css";
import "./docs-embed.css";
import "./shell.css";
import "../../DS1/0-face/grid";
import { initializeDocsEmbed } from "./lib/docsEmbed";
import { Root } from "./Root";

initializeDocsEmbed();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
