# CoworkSpace — Plataforma de reservas de espacios

Prueba técnica de Frontend Angular. SPA para gestionar reservas de espacios de coworking: listado de espacios, creación de reservas con validación de reglas de negocio, calendario semanal de ocupación, gestión de reservas (cancelar/completar) y reporte de ocupación. Frontend puro con datos simulados.

**Stack:** Angular 21 (standalone, zoneless, signals) · TypeScript estricto · Tailwind CSS v4 · Vitest

---

## Puesta en marcha

Requisitos: Node.js 20.19+ (desarrollado con 24.x) y npm.

```bash
git clone <url-del-repo>
cd coworkspace-reservas
npm install
npm start          # ng serve → http://localhost:4200
```

Otros comandos:

```bash
npm test           # suite completa con Vitest
npm run build      # build de producción
```

No necesita backend ni variables de entorno: los repositorios en memoria traen datos de ejemplo (incluye reservas de hoy y de la semana, un espacio en mantenimiento y una cancelación con penalización, para que todas las vistas muestren algo desde el primer arranque). Los datos simulan 300 ms de latencia para exhibir los estados de carga.

---

## Arquitectura

**Clean Architecture pragmática + presentación por features.** La idea central: proteger lo que no cambia (las reglas de negocio) de lo que sí cambia (el origen de datos, el framework, la UI). Se materializa en una sola regla, verificable leyendo los imports: **las dependencias apuntan siempre hacia el dominio, nunca al revés**.

### Qué hay en cada carpeta y por qué

```
src/app/
├── core/
│   ├── domain/          # El centro: TS puro, cero imports de Angular
│   ├── application/     # Stores con signals (casos de uso) + puertos
│   └── infrastructure/  # Adaptadores en memoria + datos seed
├── features/            # Una carpeta por pantalla
├── shared/ui/           # Componentes visuales reutilizables
└── testing/             # Test doubles (fakes) y builders compartidos
```

**`core/domain`** — Modelos y todas las reglas de negocio.

**`core/application`** — Los stores son los casos de uso: exponen señales de solo lectura y orquestan dominio + persistencia.

**`core/infrastructure`** — Implementaciones en memoria de los puertos, con datos seed y 300 ms de latencia simulada para exhibir los estados de carga. Única capa que se toca al conectar un backend real.

**`features/`** — Cada pantalla es una carpeta autocontenida y un chunk lazy (`loadComponent`). Los componentes consumen los stores.

**`shared/ui`** — Piezas visuales sin lógica de negocio usadas por varias features (`StatusBadge`).

### Por qué esta arquitectura

Una app de reservas tiene dos tipos de código con ritmos de cambio distintos. Las **reglas de negocio** (no solapar reservas, horario 08:00–20:00, penalización a 24 h) son estables: definen el problema. Todo lo demás es volátil: hoy los datos son mocks y mañana una API REST; la UI se rediseña; el framework evoluciona. Mezclarlos significa que cada cambio volátil arriesga romper lo estable. Esta arquitectura los separa físicamente y fuerza que la dependencia vaya en un solo sentido: la UI conoce los stores, los stores conocen el dominio, y el dominio no conoce a nadie.

---

## Testing

```bash
npm test
```

---

## Funcionalidades

- **RF-01** Listado de espacios: tarjetas responsive con tipo, capacidad, precio, características y estado en vivo (Ocupado derivado de reservas en curso). Espacios en mantenimiento no permiten reservar.
- **RF-02** Nueva reserva: formulario tipado con validación en vivo, costo estimado reactivo y preselección por query params.
- **RF-03** Calendario semanal custom (sin librerías): franjas de 30 min, ocupación por espacio, reserva en curso resaltada, detalle al tocar una franja, y clic en hueco libre → formulario prellenado con espacio, fecha y hora.
- **RF-04** Gestión de reservas: filtros combinables (fecha, espacio, estado), tabla en desktop / tarjetas en móvil, completar y cancelar con vista previa de penalización.
- **RF-05** Reporte de ocupación: cálculo 100 % en el dominio — reservas, horas, % de ocupación sobre el horario operable (08:00–20:00), ingresos estimados, espacio top y cancelaciones con penalización (registradas según RN-04), con rango de fechas configurable.
