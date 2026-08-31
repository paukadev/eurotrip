import { Route, Routes } from "react-router";
import { HomePage } from "../pages/HomePage";
import { DestinationPage } from "../pages/DestinationPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/destino/:slug" element={<DestinationPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
