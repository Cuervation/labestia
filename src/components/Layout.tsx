import { LoginButton } from "./LoginButton";
import type { MouseEvent, PropsWithChildren } from "react";

type LayoutProps = PropsWithChildren<{
  onNavigate?: (path: string) => void;
}>;

function handleInternalNavigation(event: MouseEvent<HTMLAnchorElement>, path: string, onNavigate?: (path: string) => void) {
  if (!onNavigate) {
    return;
  }

  event.preventDefault();
  onNavigate(path);
}

export function Layout({ children, onNavigate }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={(event) => handleInternalNavigation(event, "/", onNavigate)}>
          La Bestia
        </a>
        <nav className="nav-links" aria-label="Navegacion principal">
          <a href="/play" onClick={(event) => handleInternalNavigation(event, "/play", onNavigate)}>
            Jugar
          </a>
          <a href="/profile" onClick={(event) => handleInternalNavigation(event, "/profile", onNavigate)}>
            Perfil
          </a>
        </nav>
        <div className="topbar-actions">
          <LoginButton />
        </div>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}
