import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./estilo.css";

/** Celular em pé: o jogo gira e fica deitado (paisagem) para caber campo e painéis sem rolar. */
function ajustarOrientacao() {
  const celularEmPe =
    navigator.maxTouchPoints > 0 && window.innerHeight > window.innerWidth && window.innerWidth < 900;
  document.documentElement.toggleAttribute("data-deitado", celularEmPe);
}
ajustarOrientacao();
window.addEventListener("resize", ajustarOrientacao);

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
