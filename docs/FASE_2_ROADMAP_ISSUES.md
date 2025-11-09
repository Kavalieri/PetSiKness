# 🎯 Roadmap Fase 2 - Issues GitHub

**Fecha creación**: 9 Noviembre 2025
**Repositorio**: https://github.com/Kavalieri/PetSiKness
**Total Issues**: 15

---

## 📊 Resumen

Se han creado **15 issues modulares** en GitHub para guiar el desarrollo secuencial de la Fase 2 (CRUD Mascotas). Cada issue es autónoma pero con dependencias claras para mantener el orden correcto de implementación.

---

## 🗂️ Issues Creadas

### Setup y Preparación

#### [#1 - Preparación: Tipos y Constantes](https://github.com/Kavalieri/PetSiKness/issues/1)

**Labels**: `phase-2`, `pets`, `types`, `setup`

**Objetivo**: Crear estructura base de tipos y constantes para mascotas

**Entregables**:

- `types/pets.ts` - Tipos auxiliares y enums
- `lib/constants/pets.ts` - Constantes de especies, razas, etc.
- Esquema Zod `PetFormSchema`

**Dependencias**: Ninguna ✅ INICIO

---

#### [#2 - Backend: Server Actions CRUD Mascotas](https://github.com/Kavalieri/PetSiKness/issues/2)

**Labels**: `phase-2`, `pets`, `backend`, `server-actions`

**Objetivo**: Implementar toda la lógica backend para CRUD de mascotas

**Entregables**:

- `app/pets/actions.ts` con:
  - `getPets()`
  - `getPetById(id)`
  - `createPet(formData)`
  - `updatePet(id, formData)`
  - `deletePet(id)`

**Dependencias**: #1

---

#### [#3 - UI Setup: Instalar Componentes shadcn/ui](https://github.com/Kavalieri/PetSiKness/issues/3)

**Labels**: `phase-2`, `ui`, `setup`, `shadcn`

**Objetivo**: Instalar todos los componentes base de shadcn/ui necesarios

**Componentes a instalar**:

- card, button, input, label, textarea
- select, dialog, form, badge, alert, separator

**Dependencias**: Ninguna ✅ PARALELA

---

### Componentes UI

#### [#4 - Componente: PetCard](https://github.com/Kavalieri/PetSiKness/issues/4)

**Labels**: `phase-2`, `pets`, `component`, `ui`

**Objetivo**: Card individual para mostrar mascota

**Features**:

- Info básica (nombre, especie, edad, peso)
- Badges de condición corporal
- Botones de acción (ver, editar, eliminar)

**Dependencias**: #3

---

#### [#5 - Componente: PetList](https://github.com/Kavalieri/PetSiKness/issues/5)

**Labels**: `phase-2`, `pets`, `component`, `ui`

**Objetivo**: Grid responsive de mascotas

**Features**:

- Grid 1/2/3 columnas
- Empty state
- Integración con Server Actions

**Dependencias**: #2, #4

---

#### [#6 - Componente: PetForm (Crear/Editar)](https://github.com/Kavalieri/PetSiKness/issues/6)

**Labels**: `phase-2`, `pets`, `component`, `form`, `ui`

**Objetivo**: Formulario completo con validación

**Features**:

- react-hook-form + Zod
- Modo crear/editar
- Validación inline
- Estados loading/success/error
- Todos los campos del schema

**Dependencias**: #1, #2, #3

---

#### [#7 - Componente: PetDeleteDialog](https://github.com/Kavalieri/PetSiKness/issues/7)

**Labels**: `phase-2`, `pets`, `component`, `dialog`, `ui`

**Objetivo**: Dialog de confirmación para eliminar

**Features**:

- Advertencias claras
- Integración con `deletePet()`
- Estados loading/success/error

**Dependencias**: #2, #3

---

#### [#11 - Componente: PetDetailView](https://github.com/Kavalieri/PetSiKness/issues/11)

**Labels**: `phase-2`, `pets`, `component`, `detail`

**Objetivo**: Vista detallada completa de mascota

**Features**:

- Secciones organizadas
- Toda la información
- Botones de acción

**Dependencias**: #3, #7

---

### Páginas Next.js

#### [#8 - Página: Listado de Mascotas (/pets)](https://github.com/Kavalieri/PetSiKness/issues/8)

**Labels**: `phase-2`, `pets`, `page`, `ui`

**Objetivo**: Página principal de mascotas

**Features**:

- Header con título y botón añadir
- Integración PetList
- Responsive

**Dependencias**: #5

---

#### [#9 - Página: Crear Mascota (/pets/new)](https://github.com/Kavalieri/PetSiKness/issues/9)

**Labels**: `phase-2`, `pets`, `page`, `create`

**Objetivo**: Página para crear nuevas mascotas

**Features**:

- Integración PetForm
- Navegación tras éxito

**Dependencias**: #6

---

#### [#10 - Página: Editar Mascota (/pets/[id]/edit)](https://github.com/Kavalieri/PetSiKness/issues/10)

**Labels**: `phase-2`, `pets`, `page`, `edit`

**Objetivo**: Página para editar mascotas existentes

**Features**:

- Carga datos existentes
- 404 si no existe
- Integración PetForm

**Dependencias**: #2, #6

---

#### [#12 - Página: Detalle de Mascota (/pets/[id])](https://github.com/Kavalieri/PetSiKness/issues/12)

**Labels**: `phase-2`, `pets`, `page`, `detail`

**Objetivo**: Página de vista detallada

**Features**:

- Integración PetDetailView
- 404 handling

**Dependencias**: #2, #11

---

### Navegación y Testing

#### [#13 - Navegación: Añadir Link a Mascotas](https://github.com/Kavalieri/PetSiKness/issues/13)

**Labels**: `phase-2`, `navigation`, `ui`, `layout`

**Objetivo**: Actualizar navbar con link a /pets

**Features**:

- Active state
- Responsive

**Dependencias**: Ninguna ✅ PARALELA

---

#### [#14 - Testing: Validación Completa CRUD Mascotas](https://github.com/Kavalieri/PetSiKness/issues/14)

**Labels**: `phase-2`, `testing`, `qa`

**Objetivo**: Testing manual completo E2E

**Checklist**:

- Listar, crear, editar, eliminar
- Responsive
- Seguridad
- Performance

**Dependencias**: TODAS (#1-#13)

---

#### [#15 - Cierre: Documentación y Finalización](https://github.com/Kavalieri/PetSiKness/issues/15)

**Labels**: `phase-2`, `documentation`, `cleanup`

**Objetivo**: Cerrar fase con documentación completa

**Tareas**:

- Actualizar docs
- Cerrar issues
- Celebrar 🎉

**Dependencias**: TODAS (#1-#14)

---

## 📈 Orden de Ejecución Recomendado

### Sprint 1: Fundación (Issues #1, #2, #3)

```
Paralelo:
├─ #1: Tipos y Constantes
├─ #2: Server Actions (tras #1)
└─ #3: Componentes shadcn/ui
```

**Duración**: 1-2 días
**Entregable**: Backend completo y componentes UI base

---

### Sprint 2: Componentes Básicos (Issues #4, #5, #13)

```
Secuencial:
├─ #4: PetCard
├─ #5: PetList (tras #4)
└─ #13: Navegación (paralela)
```

**Duración**: 1 día
**Entregable**: Listado de mascotas funcional

---

### Sprint 3: Formularios (Issues #6, #7)

```
Secuencial:
├─ #6: PetForm
└─ #7: PetDeleteDialog
```

**Duración**: 1-2 días
**Entregable**: CRUD completo (crear, editar, eliminar)

---

### Sprint 4: Páginas (Issues #8, #9, #10, #11, #12)

```
Secuencial:
├─ #8: Página Listado
├─ #9: Página Crear
├─ #10: Página Editar
├─ #11: PetDetailView
└─ #12: Página Detalle
```

**Duración**: 1-2 días
**Entregable**: Todas las páginas funcionando

---

### Sprint 5: Testing y Cierre (Issues #14, #15)

```
Secuencial:
├─ #14: Testing completo
└─ #15: Documentación y cierre
```

**Duración**: 0.5-1 día
**Entregable**: Fase 2 100% completada

---

## 🎯 Duración Total Estimada

**Mínimo**: 4-5 días (desarrollo intensivo)
**Recomendado**: 6-8 días (con testing exhaustivo)
**Máximo**: 10 días (con imprevistos)

---

## 📋 Checklist General

### Por Issue

- [ ] Leer descripción completa
- [ ] Verificar dependencias completadas
- [ ] Implementar según especificaciones
- [ ] Ejecutar `npm run typecheck`
- [ ] Ejecutar `npm run lint`
- [ ] Testing manual
- [ ] Commitear con mensaje claro
- [ ] Pushear a GitHub
- [ ] Cerrar issue

### Por Sprint

- [ ] Todas las issues del sprint cerradas
- [ ] Testing de integración
- [ ] Documentar progreso
- [ ] Actualizar estado en `docs/ESTADO_PROYECTO.md`

---

## 🔗 Enlaces Útiles

- **Repositorio**: https://github.com/Kavalieri/PetSiKness
- **Issues Board**: https://github.com/Kavalieri/PetSiKness/issues
- **Plan Detallado**: `docs/FASE_2_PLAN.md`
- **Estado Proyecto**: `docs/ESTADO_PROYECTO.md`

---

## 🎊 Al Finalizar

Cuando todas las 15 issues estén cerradas:

1. ✅ Fase 2 oficialmente completada
2. 📚 Documentación actualizada
3. 🚀 Listo para Fase 3 (CRUD Alimentos)
4. 🎉 Celebrar el logro

**Progreso esperado**: 33.33% del proyecto (2/6 fases)

---

**Documento creado**: 9 Noviembre 2025
**Por**: GitHub Copilot AI Assistant
**Estado**: ✅ Issues creadas y listas para desarrollo
