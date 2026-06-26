import { useEffect, useRef, useState } from "react";
import { isFirebaseConfigured } from "../firebase";
import { useAuthStore } from "../store";

export function HomePage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logoRevealedRef = useRef(false);
  const soundEnabledRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const statusMessage = useAuthStore((state) => state.statusMessage);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const playAudio = () => {
      if (!soundEnabledRef.current) {
        return;
      }

      void audio.play().catch(() => undefined);
    };

    audio.muted = true;
    audio.load();
    window.addEventListener("laBestia:coverLogoRevealed", playAudio);

    return () => {
      window.removeEventListener("laBestia:coverLogoRevealed", playAudio);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const toggleSound = () => {
    const audio = audioRef.current;
    const nextSoundEnabled = !soundEnabledRef.current;

    soundEnabledRef.current = nextSoundEnabled;
    setSoundEnabled(nextSoundEnabled);

    if (!audio) {
      return;
    }

    audio.muted = !nextSoundEnabled;

    if (nextSoundEnabled && logoRevealedRef.current) {
      void audio.play().catch(() => undefined);
      return;
    }

    if (!nextSoundEnabled) {
      audio.pause();
    }
  };

  const handleLogoRevealEnd = () => {
    logoRevealedRef.current = true;
    window.dispatchEvent(new Event("laBestia:coverLogoRevealed"));
  };

  const handleAuthMenuAction = async () => {
    setMenuOpen(false);

    if (user) {
      await logout();
      return;
    }

    await login();
  };

  return (
    <section className="cover-screen" aria-label="Pantalla principal de La Bestia">
      <div className="cover-frame">
        <div className="cover-menu">
          <button
            className={`cover-menu-button${menuOpen ? " cover-menu-button--open" : ""}`}
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
          {menuOpen ? (
            <div className="cover-menu-panel">
              <a className="cover-menu-link cover-menu-link--primary" href="/ranking" onClick={() => setMenuOpen(false)}>
                Ranking
              </a>
              <button
                className="cover-menu-link cover-menu-link--danger"
                type="button"
                onClick={() => void handleAuthMenuAction()}
                disabled={loading || (!isFirebaseConfigured && !user)}
              >
                {loading ? "Cargando..." : user ? "Cerrar Sesion" : isFirebaseConfigured ? "Iniciar sesión" : "Modo local"}
              </button>
            </div>
          ) : null}
        </div>
        <button
          className={`cover-sound-button${soundEnabled ? " cover-sound-button--on" : ""}`}
          type="button"
          onClick={toggleSound}
          aria-label={soundEnabled ? "Apagar sonido" : "Prender sonido"}
          aria-pressed={soundEnabled}
        >
          <svg aria-hidden="true" viewBox="0 0 32 32" focusable="false">
            <path d="M5 12h5l7-6v20l-7-6H5z" fill="currentColor" />
            {soundEnabled ? (
              <>
                <path d="M21 11c1.4 1.4 2 3 2 5s-.6 3.6-2 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                <path d="M24 7c2.5 2.5 4 5.4 4 9s-1.5 6.5-4 9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
              </>
            ) : (
              <>
                <path d="m22 12 6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                <path d="m28 12-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
              </>
            )}
          </svg>
        </button>
        <img className="cover-image" src="/assets/portada.png" alt="La Bestia" />
        <img
          className="cover-logo-reveal"
          src="/assets/LaBestia.png"
          alt=""
          aria-hidden="true"
          onAnimationEnd={handleLogoRevealEnd}
        />
        <audio ref={audioRef} src="/assets/yocanibal.mp3" preload="auto" />
        {isFirebaseConfigured && !user ? (
          <>
            <button
              className="cover-google-button"
              type="button"
              onClick={() => void login()}
              disabled={loading}
            >
              <span className="cover-google-icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" focusable="false">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5Z" />
                  <path fill="#FF3D00" d="M6.3 14.7 12.9 19.5C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7Z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.4 39.5 16.1 44 24 44Z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.3 5.3-6 6.8l6.3 5.3C39.3 36.7 44 31 44 24c0-1.2-.1-2.4-.4-3.5Z" />
                </svg>
              </span>
              <span>{loading ? "Cargando..." : "Jugar con Google"}</span>
            </button>
            {statusMessage ? <p className="cover-auth-status">{statusMessage}</p> : null}
          </>
        ) : (
          <a className="cover-play-button" href="/play">JUGAR</a>
        )}
      </div>
    </section>
  );
}
