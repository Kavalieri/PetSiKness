# 🐾 Pet SiKness

**Sistema de gestión alimentaria para mascotas**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.14-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 📖 Descripción

Pet SiKness es una aplicación web moderna para el seguimiento y gestión de la alimentación de mascotas. Permite registrar perfiles de mascotas, mantener un catálogo de alimentos con información nutricional completa, y llevar un diario detallado de alimentación con cálculo automático de balance diario.

### Características Principales

- ✅ **Perfiles de Mascotas**: Información física, objetivos nutricionales, salud
- ✅ **Catálogo de Alimentos**: Base de datos con información nutricional completa
- ✅ **Diario de Alimentación**: Registro detallado con cantidades exactas
- ✅ **Balance Diario**: Cálculo automático de cumplimiento de objetivos
- ✅ **Multi-hogar**: Gestión de múltiples familias de mascotas
- ✅ **Auth Seguro**: Google OAuth 2.0

---

## 🚀 Quick Start

### Requisitos Previos

- Node.js 20+
- PostgreSQL 15+
- PM2 (para producción)
- Cuenta Google OAuth (credenciales configuradas)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/Kavalieri/PetSiKness.git
cd PetSiKness

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.development.local.example .env.development.local
# Editar con tus credenciales de base de datos y Google OAuth
```

### Configuración de Base de Datos

```bash
# Conectarse como postgres
sudo -u postgres psql

# Crear roles
CREATE ROLE pet_owner NOLOGIN;
CREATE ROLE pet_user LOGIN PASSWORD 'tu_password_seguro';

# Crear base de datos DEV
CREATE DATABASE pet_sikness_dev OWNER pet_owner;

# Aplicar baseline schema
\c pet_sikness_dev
\i database/migrations/20251109_000000_baseline_v1.0.0.sql

# Configurar ~/.pgpass para acceso sin contraseña
echo "127.0.0.1:5432:pet_sikness_dev:pet_user:tu_password" >> ~/.pgpass
chmod 600 ~/.pgpass
```

### Desarrollo

```bash
# Iniciar servidor DEV (puerto 3002)
./scripts/PM2_build_and_deploy_and_dev/pm2-dev-start.sh

# O con npm
npm run dev

# Acceder
http://localhost:3002
```

### Producción

```bash
# Build
npm run build

# Iniciar con PM2 (puerto 3003)
./scripts/PM2_build_and_deploy_and_dev/pm2-prod-start.sh
```

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
│  React 18 + Server Components + RSC     │
│  Tailwind CSS + shadcn/ui + Radix UI    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Backend (Next.js API Routes)      │
│    Server Actions + NextAuth + Zod      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Database (PostgreSQL 15)         │
│   7 tablas + 1 vista + 5 triggers       │
│   Types auto-generados (kysely-codegen) │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Process Manager (PM2)           │
│    DEV: 3002 | PROD: 3003              │
└─────────────────────────────────────────┘
```

### Estructura del Proyecto

```
repo/
├── app/                    # Next.js App Router
│   ├── api/auth/          # NextAuth endpoints
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── login/             # Login page
├── components/            # Componentes UI reutilizables
│   └── ui/               # shadcn/ui components
├── lib/                   # Helpers y utilidades
│   ├── db.ts             # PostgreSQL connection pool
│   ├── auth.ts           # Auth helpers
│   └── result.ts         # Result type pattern
├── types/                 # TypeScript types
│   ├── database.generated.ts  # Auto-generado desde DB
│   └── next-auth.d.ts        # NextAuth extensions
├── database/              # Migraciones SQL
│   └── migrations/
├── scripts/               # Scripts operativos
│   ├── migrations/        # Type generation
│   └── PM2_build_and_deploy_and_dev/  # PM2 management
├── .vscode/              # VSCode tasks y settings
└── public/               # Assets estáticos
```

---

## 🗄️ Modelo de Datos

### Entidades Principales

**Profiles** → Usuarios del sistema (OAuth)

- auth_id, email, display_name, avatar_url

**Households** → Familias de mascotas

- name, created_by

**Household Members** → Membresía en hogares

- role (owner/member)

**Pets** → Perfiles de mascotas

- Información física: species, breed, weight, body_condition
- Objetivos: daily_food_goal_grams, daily_meals_target
- Salud: allergies[], medications[], health_notes
- Comportamiento: appetite, activity_level

**Foods** → Catálogo de alimentos

- Nutrición: calories_per_100g, protein%, fat%, carbs%, fiber%, moisture%
- Producto: brand, ingredients, serving_size, price
- Calidad: palatability, digestibility
- Restricciones: suitable_for_species[], age_range

**Feedings** → Registros de alimentación

- Qué: pet_id, food_id
- Cuándo: feeding_date, feeding_time, meal_number
- Cantidades: served_grams, eaten_grams, leftover_grams
- Comportamiento: appetite_rating, eating_speed
- Resultados: vomited, had_diarrhea, stool_quality

**Daily Feeding Summary** (Vista) → Resumen agregado

- total_eaten vs daily_goal
- goal_achievement_pct
- under/met/over_target status

### Diagrama de Relaciones

```
profiles
    ↓
household_members ←→ households
    ↓                    ↓
                     pets ←→ feedings ←→ foods
                              ↓
                    daily_feeding_summary (view)
```

---

## 🔐 Seguridad

### Autenticación

- Google OAuth 2.0 vía NextAuth
- Sessions JWT con 30 días de expiración
- Auto-creación de perfiles en primer login

### Base de Datos

- Roles PostgreSQL con mínimos privilegios
- Usuario de aplicación sin permisos DDL
- Queries parametrizadas (protección SQL injection)
- Conexión sin contraseña vía ~/.pgpass

### Autorización

- Filtrado obligatorio por `household_id`
- Verificación de membresía en Server Actions
- RLS (Row Level Security) preparado para futuro

---

## 📝 Scripts Disponibles

### Desarrollo

```bash
npm run dev           # Servidor DEV (puerto 3002)
npm run typecheck     # Verificar tipos TypeScript
npm run lint          # ESLint
```

### Types

```bash
npm run types:generate:dev   # Generar types desde DEV DB
npm run types:generate:prod  # Generar types desde PROD DB
```

### Producción

```bash
npm run build         # Build para producción
npm start             # Servidor PROD (puerto 3003)
```

### PM2 (Scripts Bash)

```bash
./scripts/PM2_build_and_deploy_and_dev/pm2-dev-start.sh   # Iniciar DEV
./scripts/PM2_build_and_deploy_and_dev/pm2-dev-stop.sh    # Detener DEV
./scripts/PM2_build_and_deploy_and_dev/pm2-prod-start.sh  # Iniciar PROD
./scripts/PM2_build_and_deploy_and_dev/pm2-prod-stop.sh   # Detener PROD
./scripts/PM2_build_and_deploy_and_dev/pm2-status.sh      # Ver estado
```

---

## 🧪 Testing

**Estado**: Testing pendiente de implementación

```bash
# Cuando se implementen
npm test              # Ejecutar tests
npm run test:watch    # Tests en modo watch
npm run test:coverage # Cobertura de tests
```

---

## 🚀 Deployment

### Variables de Entorno Requeridas

**Desarrollo** (`.env.development.local`):

```bash
DATABASE_URL="postgresql://pet_user:PASSWORD@localhost:5432/pet_sikness_dev"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="..."
PORT=3002
NODE_ENV=development
```

**Producción** (`.env.production.local`):

```bash
DATABASE_URL="postgresql://pet_user:PASSWORD@localhost:5432/pet_sikness_prod"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="https://petsikness.com"
NEXTAUTH_SECRET="..."
PORT=3003
NODE_ENV=production
```

### Proceso de Deploy

1. **Build**: `npm run build`
2. **Backup DB**: `sudo -u postgres pg_dump pet_sikness_prod > backup.sql`
3. **Migraciones**: Aplicar cambios de schema si hay
4. **Deploy**: `./scripts/PM2_build_and_deploy_and_dev/pm2-prod-start.sh`
5. **Smoke Test**: Verificar endpoints críticos

---

## 📚 Documentación

- **[AGENTS.md](AGENTS.md)**: Instrucciones para agentes IA
- **[docs/ESTADO_PROYECTO.md](docs/ESTADO_PROYECTO.md)**: Estado actual y roadmap
- **[docs/FASE_2_PLAN.md](docs/FASE_2_PLAN.md)**: Plan detallado CRUD Mascotas
- **[database/README.md](database/README.md)**: Documentación de base de datos
- **[app/AGENTS.md](app/AGENTS.md)**: Patrones de componentes Next.js
- **[.vscode/tasks.json](.vscode/tasks.json)**: Tareas de VSCode disponibles
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)**: GitHub Copilot setup

---

## 🤝 Contribuir

**Estado**: Proyecto en desarrollo inicial (v1.0.0)

Cuando esté listo para contribuciones:

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'feat: add amazing feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, puntos y comas, etc
refactor: refactorización de código
test: añadir tests
chore: cambios en build, etc
```

---

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles

---

## 👥 Autores

- **Kava** - Desarrollo inicial - [Kavalieri](https://github.com/Kavalieri)
- **AI Assistant** - Setup automático y documentación

---

## 🙏 Agradecimientos

- Proyecto hermano: [CuentasSiK](https://github.com/Kavalieri/CuentasSiK) - Inspiración arquitectónica
- [Next.js](https://nextjs.org/) - Framework React
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Radix UI](https://www.radix-ui.com/) - Primitivas UI accesibles
- [Kysely](https://kysely.dev/) - Type-safe SQL query builder

---

## 📞 Contacto

**Proyecto**: Pet SiKness
**Repositorio**: [https://github.com/Kavalieri/PetSiKness](https://github.com/Kavalieri/PetSiKness)
**Website**: https://petsikness.com (futuro)

---

**Última actualización**: 9 de Noviembre de 2025 - v1.0.0
**Estado**: ✅ Setup completado, repositorio sincronizado, listo para desarrollo Fase 2
