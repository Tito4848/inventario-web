Tailwind setup

Run these commands in `d:/Inventario-Web/frontend` to install Tailwind and PostCSS:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

Ensure `tailwind.config.cjs` and `postcss.config.cjs` are present (they are included in the repo). Start dev server with:

```bash
npm run dev
```

Environment variable

Create a `.env` file (or set env vars for Vite) with the API URL for Payload if you want the frontend to create products server-side:

```
VITE_API_URL=http://localhost:3000
```

When `VITE_API_URL` is set the product form will attempt to upload an image to `${VITE_API_URL}/api/media` and create the product at `${VITE_API_URL}/api/products`. The frontend sends cookies (`credentials: 'include'`) so an authenticated session (HttpOnly cookie) is preferred. If `VITE_API_URL` is not set the form uses the local mock behavior.

