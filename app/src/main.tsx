import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../DS1/1-root/one.css";
import "../../DS1/2-core/ds-icon";
import "./app.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
