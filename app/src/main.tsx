import App from "./App.tsx";
import { createRoot } from "react-dom/client";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { TonConnectProvider } from "./contexts/TonConnectContext";
import "./assets/index.css";

const manifestUrl =
  "https://raw.githubusercontent.com/dExNight/ProjectConfigurations/main/nobby_marketplace_manifest.json";

createRoot(document.getElementById("root")!).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <TonConnectProvider>
      <App />
    </TonConnectProvider>
  </TonConnectUIProvider>
);
