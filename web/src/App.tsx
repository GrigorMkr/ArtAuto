import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { VehiclePage } from "./pages/VehiclePage";
import { CalculatorPage } from "./pages/CalculatorPage";
import { ContactsPage } from "./pages/ContactsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { CabinetPage } from "./pages/CabinetPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";

import { AdminPage } from "./pages/AdminPage";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="cars/:slug" element={<VehiclePage />} />
          <Route path="calculator" element={<CalculatorPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="cabinet" element={<CabinetPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
