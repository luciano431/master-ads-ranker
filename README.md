# Master Ads Ranker

Herramienta interna de Ranker Studio para analizar el rendimiento creativo de anuncios de Meta: qué creativos escalar y cuáles pausar.

Proyecto independiente del dashboard de KPIs de clientes (`ranker-analytics`). No comparte código ni modifica sus funciones.

## MVP actual: Creative Analytics

- Selector de cuenta publicitaria y de período (7/14/30/60/90 días completos, sin contar hoy)
- Resumen: anuncios con entrega, gasto total, ROAS promedio (ponderado por gasto) y revenue total
- Top N anuncios por gasto, en **gráfico** (2 métricas cruzadas, cada una con su eje) o **tabla** ordenable
- Cada anuncio muestra su thumbnail (marca de ▶ si es video, link a la vista previa de Meta)
- Métricas: Spend, Revenue, ROAS, CPA, Conversiones, Impresiones, CTR, CPC
- Conversión configurable: compras o leads (para clientes de generación de leads)

Ads, Ad Insights, Top Performers, Reporte Mensual y Escenarios están en el menú como "pronto".

## Stack

- React 19 + Vite + TanStack Router + Tailwind v4 + Recharts (tema oscuro)
- Backend: Supabase Edge Function `creative-analytics` (Deno), en `supabase/functions/`

## Desarrollo

```bash
npm install
cp .env.example .env   # dejalo vacío para usar datos de demo
npm run dev
npm test               # tests de métricas derivadas
npm run build
```

Sin `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` la app corre en **modo demo** con datos de ejemplo.

## Deploy de la Edge Function

La función es **nueva y separada** de `meta-ads`: desplegarla no toca la función que usa el dashboard de producción. Se puede desplegar en el mismo proyecto Supabase para reutilizar el secreto `META_ACCESS_TOKEN`:

```bash
supabase login
supabase functions deploy creative-analytics --project-ref <project-ref>
```

Secretos que usa:

| Secreto | Obligatorio | Uso |
|---|---|---|
| `META_ACCESS_TOKEN` | sí | Ya existe en el proyecto actual |
| `META_API_VERSION` | no | Versión de la Graph API (por defecto `v23.0`) |
| `ALLOWED_ACCOUNT_IDS` | no | Lista `act_1,act_2` para limitar qué cuentas se pueden consultar |

### API

`POST /functions/v1/creative-analytics`

- `{ "mode": "accounts" }` → cuentas publicitarias del token
- `{ "mode": "ads", "account_id": "act_123", "since": "2026-10-01", "until": "2026-10-27" }` → métricas crudas por anuncio + creativo

La función devuelve métricas crudas; CPA, ROAS, CTR y CPC se calculan en el front (`src/lib/metrics.ts`).

## Decisiones (respuestas a las preguntas abiertas)

**¿Mismo proyecto Supabase o uno nuevo?** El mismo, pero con una función nueva. Es lo más rápido (el token ya está) y no hay riesgo para producción porque `meta-ads` no se modifica. Si más adelante la herramienta necesita tablas propias, conviene pasarla a un proyecto Supabase aparte.

**¿Cómo traer thumbnails de forma eficiente?**
1. Una sola consulta de insights a nivel `ad` para toda la cuenta (paginada, 500 por página): trae solo los anuncios con entrega en el período.
2. Los creativos se piden en lotes de 50 ads con `?ids=…` y en paralelo. Con 300 anuncios son 6 requests, no 300.
3. Se pide `thumbnail_width(320)` porque por defecto Meta devuelve 64×64.
4. Caché de 10 minutos en la función por cuenta+período, para que cambiar métricas o recargar no vuelva a golpear la API.

Las URLs de thumbnail de Meta vencen con el tiempo. Para guardar histórico habría que copiarlas a Supabase Storage (siguiente etapa).

**¿De dónde sale revenue/ROAS?** Del `action_values` de compra que reporta Meta (pixel/CAPI). Se toma el primer action_type presente en este orden: `omni_purchase` → `purchase` → `offsite_conversion.fb_pixel_purchase` → `onsite_web_purchase`, para no contar la misma compra dos veces. Si un cliente mide ventas en otra fuente (Shopify, CRM), se puede agregar después un override por cliente.

Otras reglas: CTR y CPC usan `inline_link_clicks` (no `clicks`, que infla). CPA = gasto / conversiones del tipo elegido.

## Próximos pasos sugeridos

- Top Performers: agrupar por ángulo/producto/promo a partir de una convención de nombres de anuncios
- Copiar los thumbnails a Storage para conservar histórico
- Ad Insights con IA sobre los top/bottom creativos
- Reporte mensual automático
