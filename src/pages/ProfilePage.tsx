import { LoginButton } from "../components";
import { useAuthStore } from "../store";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  return (
    <section className="page-stack profile-screen">
      <div className="page-heading">
        <span className="eyebrow">Perfil de conductor</span>
        <h1>Perfil</h1>
      </div>

      {loading ? <div className="panel"><p>Cargando perfil...</p></div> : null}

      {!loading && !user ? (
        <div className="panel">
          <p>No hay sesion iniciada.</p>
          <p>Entrá con Google para guardar puntajes y aparecer en ranking.</p>
          <LoginButton />
        </div>
      ) : null}

      {!loading && user ? (
        <>
          <div className="panel">
            <h2>{user.displayName}</h2>
            <p>UID: {user.uid}</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Mejor puntaje</span>
              <strong>—</strong>
            </div>
            <div className="stat-card">
              <span>Partidas jugadas</span>
              <strong>—</strong>
            </div>
            <div className="stat-card">
              <span>Estado</span>
              <strong>Conectado</strong>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
