// Pantalla de ayuda cuando falta configurar el archivo .env
export default function ConfigMissing({ missing }) {
  return (
    <div className="center-screen">
      <div className="panel config-missing">
        <h1 className="display">Falta configurar la app</h1>
        <p>No encontramos estas variables de entorno:</p>
        <ul>
          {missing.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
        <p>
          Creá un archivo <code>.env</code> junto a <code>package.json</code> (podés copiar{' '}
          <code>.env.example</code>), completá los valores y reiniciá el servidor con{' '}
          <code>npm run dev</code>. En Vercel, cargalas en Settings → Environment Variables y hacé
          Redeploy.
        </p>
      </div>
    </div>
  );
}
