import { LoginButton } from "./LoginButton";
import type { PropsWithChildren } from "react";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">La Bestia</a>
        <nav className="nav-links" aria-label="Navegacion principal">
          <a href="/play">Jugar</a>
          <a href="/profile">Perfil</a>
        </nav>
        <div className="topbar-actions">
          <LoginButton />
        </div>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}
