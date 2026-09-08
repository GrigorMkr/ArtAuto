import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HelmetProvider } from "react-helmet-async";
import { store } from "./store/store";
import { AuthProvider } from "./auth";
import App from "./App";
import "./index.css";

/** Prefix public assets with Vite base (`/ArtAuto/` on GitHub Pages). */
const assetBase = import.meta.env.BASE_URL || "/";
const rootStyle = document.documentElement.style;
rootStyle.setProperty("--hero", `url("${assetBase}brand/artauto-hero.jpg?v=2")`);
rootStyle.setProperty("--brand-logo", `url("${assetBase}brand/artauto-logo.png?v=8")`);

const fontStyle = document.createElement("style");
fontStyle.textContent = `
@font-face {
  font-family: "Loos Wide";
  src: url("${assetBase}fonts/loos-wide-medium.woff2") format("woff2"),
       url("${assetBase}fonts/loos-wide-medium.woff") format("woff");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Loos Wide";
  src: url("${assetBase}fonts/loos-normal-medium.woff2") format("woff2"),
       url("${assetBase}fonts/loos-normal-medium.woff") format("woff");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Manrope Local";
  src: url("${assetBase}fonts/manrope-medium.woff2") format("woff2"),
       url("${assetBase}fonts/manrope-medium.woff") format("woff");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Manrope Local";
  src: url("${assetBase}fonts/manrope-600-cyrillic.woff2") format("woff2"),
       url("${assetBase}fonts/manrope-600-latin.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
`;
document.head.appendChild(fontStyle);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HelmetProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HelmetProvider>
    </Provider>
  </StrictMode>
);
