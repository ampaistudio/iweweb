import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App";
import Home from "./pages/Home";
import TourDetail from "./pages/TourDetail";
import PackageDetail from "./pages/PackageDetail";
import NewsList from "./pages/NewsList";
import NewsDetail from "./pages/NewsDetail";
import Privacy from "./pages/Privacy";
import { PreferencesProvider } from "./context/PreferencesContext";
import { SiteDataProvider } from "./context/SiteDataContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreferencesProvider>
      <SiteDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<App />}>
              <Route index element={<Home />} />
              <Route path="tour/:tourId" element={<TourDetail />} />
              <Route path="paquete/:packageId" element={<PackageDetail />} />
              <Route path="novedades" element={<NewsList />} />
              <Route path="novedades/:slug" element={<NewsDetail />} />
              <Route path="privacidad" element={<Privacy />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SiteDataProvider>
    </PreferencesProvider>
  </StrictMode>
);
