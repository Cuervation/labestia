import { LoginButton } from "../components";

export function HomePage() {
  return (
    <section className="hero-screen">
      <div className="hero-copy">
        <span className="eyebrow">Arcade barrial top-down</span>
        <h1>LA BESTIA</h1>
        <p className="hero-tagline">No frenar. No pensar. Destruir.</p>
        <p className="hero-description">
          Camioneta roja, caos porteño y noventa segundos para dejar el barrio dado vuelta.
        </p>
        <div className="hero-actions">
          <a className="primary-link" href="/play">Jugar</a>
          <a className="secondary-link" href="/ranking">Ranking</a>
          <LoginButton />
        </div>
      </div>
      <div className="hero-card panel">
        <h2>Objetivo</h2>
        <ul className="feature-list">
          <li>Chocá autos para sumar puntos.</li>
          <li>Encadená impactos para subir combo.</li>
          <li>Terminá arriba en ranking global.</li>
        </ul>
      </div>
    </section>
  );
}
