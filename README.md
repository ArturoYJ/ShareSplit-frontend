# ShareSplit Frontend

Aplicación web en Next.js para gestión de gastos compartidos por consumo individual.

## Scripts

```bash
npm run dev        # desarrollo
npm run lint       # lint
npm run build      # build de producción
npm run start      # servidor producción
npm run test:e2e   # E2E críticos (Playwright)
```

## Variables de entorno

Crear `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## E2E críticos

Los tests E2E usan:

- `E2E_BASE_URL` (default: `http://localhost:3000`)
- `E2E_API_URL` (default: `http://localhost:3001/api`)

Ejemplo:

```bash
E2E_BASE_URL=http://localhost:3000 \
E2E_API_URL=http://localhost:3001/api \
npm run test:e2e
```

## Flujo funcional cubierto

- Login con JWT
- Crear/unirse a grupo
- Ver detalle de grupo y miembros
- Registrar gasto por ítems
- Reclamar consumos
- Ver balances/deudas
- Registrar pagos
- Gestión de miembros (expulsar, transferir ownership, abandonar, eliminar grupo)
