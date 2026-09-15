import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App";
import Home from "./pages/Home";
import TourDetail from "./pages/TourDetail";
import { PreferencesProvider } from "./context/PreferencesContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreferencesProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Home />} />
            <Route path="tour/:tourId" element={<TourDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PreferencesProvider>
  </StrictMode>
);
