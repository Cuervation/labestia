import { useCallback, useEffect, useState } from "react";
import { Layout } from "../components";
import { HomePage, PlayPage, ProfilePage } from "../pages";
import { startAuthStoreSync } from "../store";

function getCurrentPage(pathname: string, navigate: (path: string) => void) {
  switch (pathname) {
    case "/play":
      return <PlayPage />;
    case "/profile":
      return <ProfilePage />;
    case "/":
      return <HomePage onNavigate={navigate} />;
    default:
      return <HomePage onNavigate={navigate} />;
  }
}

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => startAuthStoreSync(), []);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }

    setPathname(path);
  }, []);

  return <Layout onNavigate={navigate}>{getCurrentPage(pathname, navigate)}</Layout>;
}
