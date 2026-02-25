# 🚀 Guía de Despliegue en Vercel - Élara Atelier

Esta guía detalla los pasos necesarios para realizar el primer despliegue exitoso de la aplicación en Vercel utilizando el plan Hobby, conectada a la base de datos de Supabase.

---

## 1. Subir el Código a GitHub

1. Inicializa el repositorio si aún no lo has hecho:
   ```bash
   git init
   git add .
   git commit -m "Preparación para despliegue en Vercel"
   ```
2. Crea un repositorio nuevo en GitHub (público o privado).
3. Vincula y sube el código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Configuración en el Dashboard de Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard) y haz clic en **"Add New..."** -> **"Project"**.
2. Selecciona tu repositorio de GitHub.
3. En **Project Settings**:
   - **Framework Preset**: Selecciona `Next.js`.
   - **Root Directory**: `./`
   - **Build Command**: `next build` (estándar).

---

## 3. Variables de Entorno (Checklist Estricto) 🔐

Antes de darle a "Deploy", abre la sección **Environment Variables** y pega las siguientes variables (ajustando los valores según tu `.env` local y Supabase):

| Variable | Descripción / Nota |
| :--- | :--- |
| `DATABASE_URL` | **Pooler Connection String** (Supabase -> Database Settings -> Connection String -> Mode: **Transaction**, tipo: **Prisma**). Debe terminar en `?pgbouncer=true`. |
| `DIRECT_URL` | **Direct Connection String** (Supabase -> Database Settings -> Connection String -> Mode: **Session** o puerto 5432). |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La `anon public` key de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | La `service_role` key (mantenla secreta). |
| `AUTH_SECRET` | Una cadena aleatoria larga para las sesiones (puedes usar la de tu `.env`). |
| `AUTH_COOKIE` | `elara_session` (o el nombre que prefieras). |
| `SITE_URL` | La URL final de Vercel (ej: `https://elara-atelier.vercel.app`). |
| `NEXT_PUBLIC_SITE_URL` | Igual que `SITE_URL`. |
| `NEXT_PUBLIC_WHATSAPP_NUMERO` | Tu número de WhatsApp de atención. |

> [!IMPORTANT]
> Para `DATABASE_URL` en Vercel, es **obligatorio** usar el pooler de Supabase para evitar errores de exceso de conexiones en el plan Hobby.

---

## 4. Configuración de Autenticación en Supabase 🛠️

Para que el inicio de sesión funcione correctamente desde Vercel, debes autorizar la nueva URL:

1. Ve a tu panel de **Supabase**.
2. Entra en **Authentication** -> **URL Configuration**.
3. En **Site URL**, pon tu URL de producción: `https://tu-proyecto.vercel.app`.
4. En **Redirect URLs**, añade:
   - `https://tu-proyecto.vercel.app/**`
   - `http://localhost:3000/**` (para seguir probando localmente).

---

## 5. Notas Finales de DevOps

- **Construcción**: El comando `postinstall` en `package.json` ejecutará automáticamente `prisma generate` en Vercel, asegurando que el cliente de base de datos esté listo para la compilación.
- **Edge Runtime**: Algunos componentes están configurados para `nodejs` para compatibilidad total con librerías de reportes (PDF/Excel). Vercel lo manejará correctamente de forma predeterminada.

¡Listo! Haz clic en **Deploy** y observa cómo **Élara Atelier** cobra vida en la web.
