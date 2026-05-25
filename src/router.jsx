import { createBrowserRouter } from "react-router";
import { ServicesPage } from "./ui/components/pages/ServicesPage";
import { PricingPage } from "./ui/components/pages/PricingPage";
import { CheckoutPage } from "./ui/components/pages/CheckoutPage";
import { UnsubscribePage } from "./ui/components/pages/UnsubscribePage";
import { HomePage } from "./ui/components/pages/HomePage";
import { AboutPage } from "./ui/components/pages/AboutPage";
import { ProductsPage } from "./ui/components/pages/ProductsPage";
import { CartPage } from "./ui/components/pages/CartPage";
import { TrainingPage } from "./ui/components/pages/TrainingPage";
import { AccountPage } from "./ui/components/pages/AccountPage";
import { ProfilePage } from "./ui/components/pages/ProfilePage";
import { OrdersPage } from "./ui/components/pages/OrdersPage";
import { SettingsPage } from "./ui/components/pages/SettingsPage";
import App from "./App";
import { Skeleton } from "./ui/components/shared/Skeleton";
import { ErrorBoundary } from "./ui/components/ErrorBoundary.jsx";

const LoadingFallback = () => (
  <div style={{ padding: '40px' }}>
    <Skeleton />
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    errorElement: <ErrorBoundary hasError={true} error="Erreur dans la route" />,
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: "products",
        Component: ProductsPage,
      },
      {
        path: "services",
        Component: ServicesPage,
      },
      {
        path: "about",
        Component: AboutPage,
      },
      {
        path: "pricing",
        Component: PricingPage,
      },
      {
        path: "cart",
        Component: CartPage,
      },
      {
        path: "checkout",
        Component: CheckoutPage,
      },
      {
        path: "unsubscribe",
        Component: UnsubscribePage,
      },
      {
        path: "training",
        Component: TrainingPage,
      },
      {
        path: "account",
        Component: AccountPage,
      },
      {
        path: "profile",
        Component: ProfilePage,
      },
      {
        path: "orders",
        Component: OrdersPage,
      },
      {
        path: "settings",
        Component: SettingsPage,
      },
      {
        path: "vision",
        lazy: () =>
          import("./ui/components/pages/VisionPage").then((module) => ({
            Component: module.VisionPage,
          })),
      },
      {
        path: "nlp",
        lazy: () =>
          import("./ui/components/pages/NLPPage").then((m) => ({
            Component: m.NLPPage,
          })),
      },
      {
        path: "benchmark",
        lazy: () =>
          import("./ui/components/pages/BenchmarkPage").then((m) => ({
            Component: m.BenchmarkPage,
          })),
      },
    ],
  },
], {
  fallbackElement: <LoadingFallback />
});
