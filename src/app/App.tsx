import { useEffect } from "react";
import { Layout } from "../components";
import { HomePage, PlayPage, ProfilePage } from "../pages";
import { startAuthStoreSync } from "../store";

function getCurrentPage() {
  switch (window.location.pathname) {
    case "/play":
      return <PlayPage />;
    case "/profile":
      return <ProfilePage />;
    case "/":
      return <HomePage />;
    default:
      return <HomePage />;
  }
}

export function App() {
  useEffect(() => startAuthStoreSync(), []);

  return <Layout>{getCurrentPage()}</Layout>;
}
