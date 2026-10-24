import "dotenv/config";

function requerido(nombre: string, minimo = 16): string {
  const valor = process.env[nombre];
  if (!valor || valor.length < minimo) {
    throw new Error(
      `Variable de entorno ${nombre} ausente o demasiado corta (mínimo ${minimo} caracteres). ` +
        `Revisa tu archivo .env antes de arrancar.`,
    );
  }
  return valor;
}

export const JWT_SECRET = requerido("JWT_SECRET", 32);

export const CORS_ORIGINS: string[] = (
  process.env.CORS_ORIGINS ??
  "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
