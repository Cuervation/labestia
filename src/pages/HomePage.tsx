export function HomePage() {
  return (
    <section className="cover-screen" aria-label="Pantalla principal de La Bestia">
      <img className="cover-image" src="/assets/portada.png" alt="La Bestia" />
      <a className="cover-play-button" href="/play">JUGAR</a>
    </section>
  );
}