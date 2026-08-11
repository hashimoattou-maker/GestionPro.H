import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Toaster } from "react-hot-toast";
import { useTranslation, type TranslationKey } from "@/i18n/LanguageContext";

const pageTitleKeys: Record<string, TranslationKey> = {
  "/dashboard": "pageTitle.dashboard",
  "/stock/products": "pageTitle.products",
  "/stock/products/new": "pageTitle.newProduct",
  "/stock/categories": "pageTitle.categories",
  "/stock/movements": "pageTitle.movements",
  "/clients": "pageTitle.clients",
  "/clients/new": "pageTitle.newClient",
  "/clients/import": "pageTitle.importClients",
  "/fournisseurs": "pageTitle.suppliers",
  "/fournisseurs/new": "pageTitle.newSupplier",
  "/achats/bc": "pageTitle.bonsCommande",
  "/achats/ba": "pageTitle.bonsArrivage",
  "/achats/factures": "pageTitle.facturesAchats",
  "/achats/avoirs": "pageTitle.avoirsAchats",
  "/ventes/devis": "pageTitle.devis",
  "/ventes/commandes": "pageTitle.commandesClients",
  "/ventes/bl": "pageTitle.bonsLivraison",
  "/ventes/factures": "pageTitle.facturesVentes",
  "/ventes/avoirs": "pageTitle.avoirsVentes",
  "/parametres": "pageTitle.settingsCompany",
  "/parametres/designs": "pageTitle.docModels",
  "/parametres/colonnes": "pageTitle.settingsColumns",
  "/profil": "pageTitle.myProfile",
  "/utilisateurs": "pageTitle.users",
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const basePath = "/" + location.pathname.split("/").slice(1, 3).join("/");
  const titleKey = pageTitleKeys[location.pathname] || pageTitleKeys[basePath];
  const title = titleKey ? t(titleKey) : "GestionPRO";

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="no-print">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="no-print">
          <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <div className="no-print">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "8px",
              background: "#333",
              color: "#fff",
            },
          }}
        />
      </div>
    </div>
  );
}
