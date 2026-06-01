# Inventory Management

Aplicación móvil de gestión de inventario para pequeñas y medianas empresas. Desarrollada con React Native 0.82.1 para Android e iOS. Funciona completamente **offline** con base de datos local SQLite.

---

## Características principales

### Productos
- CRUD completo (código, nombre, descripción, precio, stock inicial, imagen)
- Asignación de **categoría** (con color visual), **proveedor** y **unidad de medida**
- Búsqueda por código o nombre
- Paginación incremental para inventarios grandes
- Importación masiva desde Excel (.xlsx)
- Exportación de catálogo a Excel

### Entradas y Salidas de inventario
- Registro de movimientos con tipo, comentarios y múltiples productos por movimiento
- Validación de stock en tiempo real antes de confirmar una salida
- Advertencia inline de stock insuficiente al agregar productos en el formulario
- Vista de detalle completa de cada movimiento (badge Entrada/Salida, tipo, fecha, comentarios, lista de productos con subtotales y total)
- Filtro por rango de fechas en listas y dashboards
- Exportación de movimientos a Excel

### Dashboards
- Resumen por tipo de movimiento: cantidad de unidades y valor total
- Filtro de fecha inicial y final con selector visual
- Compatible con tipos de movimiento del catálogo de BD (incluye tipos personalizados)

### Reportes
- **Reporte Crítico**: productos con stock bajo (umbral configurable) y productos sin stock, top productos más movidos
- **Resumen General**: valor total del inventario, total de productos, unidades en stock, distribución por rangos
- **Reporte de Movimientos**: entradas vs salidas, movimientos por tipo, top 5 categorías

### Catálogos configurables
- **Tipos de movimiento**: CRUD con activar/desactivar, separados por Entradas y Salidas
- **Categorías de producto**: CRUD con selector de color visual (10 colores predefinidos)
- **Proveedores**: CRUD con teléfono, email, dirección y notas; vista expandible por proveedor
- **Unidades de medida**: CRUD con nombre y abreviación (badge visual); seeds: uds, kg, g, L, ml, caj, par, m, cm

### Configuración
- Carpeta de imágenes de productos
- Símbolo de moneda (visible en precios, dashboards y detalle de movimientos)
- Umbral de stock bajo (usado en reportes críticos)
- Nombre de empresa
- Descarga de copia de seguridad de la base de datos

### Temas
- Modo claro y oscuro (detección automática del sistema + preferencia guardada en BD)
- Todos los componentes usan el sistema de tokens de diseño (`theme.colors`, `theme.typography`, `theme.borderRadius`, `theme.elevation`)

### Otras funcionalidades
- Pantalla de permisos al inicio (Android): solicita acceso a imágenes según API level
- Splash screen con logo transparente adaptable a tema claro/oscuro
- Soporte para importación de archivos Excel multiplataforma (Android content:// e iOS file://)

---

## Stack técnico

| Tecnología | Versión | Uso |
|---|---|---|
| React Native | 0.82.1 | Framework principal |
| TypeScript | ^5.8.3 | Tipado estático |
| TypeORM | ^0.3.27 | ORM para SQLite |
| react-native-nitro-sqlite | ^9.1.11 | Driver SQLite nativo de alta performance |
| @react-navigation/native-stack | ^7.6.2 | Navegación entre pantallas |
| @react-navigation/material-top-tabs | ^7.4.2 | Pestañas principales (Productos / Entradas / Salidas) |
| react-native-date-picker | ^4.3.5 | Selector de fechas nativo |
| react-native-select-dropdown | ^3.4.0 | Dropdowns temados con búsqueda |
| exceljs | ^4.4.0 | Importación y exportación de archivos Excel |
| @dr.pogodin/react-native-fs | ^2.22.0 | Acceso al sistema de archivos (cross-platform) |
| @react-native-documents/picker | ^11.0.0 | Selector de archivos e imágenes |
| react-native-vector-icons | ^10.0.3 | Iconografía (Ionicons) |
| fast-check | ^4.8.0 | Tests de propiedades |

---

## Esquema de base de datos

```
product          — Productos del inventario
product_category — Catálogo de categorías (con color)
supplier         — Catálogo de proveedores
unit_of_measure  — Catálogo de unidades de medida
log_header       — Cabecera de cada movimiento (entrada/salida)
log_detail       — Líneas de productos por movimiento
movement_type    — Catálogo de tipos de movimiento
configuration    — Configuración clave-valor de la app
```

Las migraciones se ejecutan automáticamente al iniciar la app (`migrationsRun: true`).

---

## Requisitos previos

- Node.js >= 20
- React Native CLI configurado ([guía oficial](https://reactnative.dev/docs/set-up-your-environment))
- Android: SDK con API 29 o superior
- iOS: Xcode 15+, CocoaPods

---

## Instalación

```sh
# Instalar dependencias JS
npm install

# iOS — instalar dependencias nativas (solo primera vez o al actualizar)
bundle install
bundle exec pod install
```

---

## Ejecución en desarrollo

```sh
# Iniciar Metro bundler
npm start

# Android
npm run android

# iOS
npm run ios
```

---

## Tests

```sh
npm test
```

Incluye tests unitarios y tests de propiedades (property-based testing con `fast-check`) para:
- Validación de stock
- Cálculo de reportes (distribución, valor de inventario, productos críticos)

---

## Estructura del proyecto

```
src/
├── assets/                  # Imágenes y recursos estáticos
├── components/
│   ├── button/              # Fab, TouchableButton
│   ├── feedback/            # EmptyState, Toast, SkeletonLoader, ErrorBoundary
│   ├── form/                # LogForm, ProductForm
│   ├── input/               # InputDate, InputForm, InputSearch
│   ├── navigation/          # HeaderLeft, HeaderRight
│   └── product/             # ProductItem
├── config/                  # Constantes y claves de configuración
├── context/                 # ThemeContext, ProductContext
├── database/
│   ├── connection/          # DataSource (TypeORM)
│   ├── migrations/          # Migraciones SQL numeradas
│   ├── models/              # Entidades TypeORM
│   └── repository/          # Funciones de acceso a datos
├── design-system/
│   ├── themes/              # light.ts, dark.ts
│   └── tokens/              # colors, typography, spacing, elevation, borders
├── hooks/                   # useTheme, useProducts, useInputs, useOutputs, etc.
├── interfaces/              # Tipos de navegación por stack
├── screens/
│   ├── catalog/             # CategoryCatalog, SupplierCatalog, UnitOfMeasureCatalog, MovementTypeCatalog
│   ├── configuration/       # ConfigurationScreen
│   ├── input/               # InputList, CreateInput, ReadInput, DashboardInput
│   ├── output/              # OutputList, CreateOutput, ReadOutput, DashboardOutput
│   ├── permissions/         # PermissionsScreen (Android)
│   ├── product/             # ProductList, CreateProduct, UpdateProduct
│   └── reports/             # CriticalReport, SummaryReport, MovementReport
├── services/                # ExcelService, ReportService
├── stacks/                  # AppStartStack, PrincipalStack, ProductStack, InputStack, OutputStack
├── styles/                  # Estilos globales
└── utils/                   # dateTime, formatCurrency, stockValidator, validateLogForm
```

---

## Plataformas

| Plataforma | Estado |
|---|---|
| Android (API 29+) | Soportado |
| iOS | Soportado |

---

## Licencia

Uso privado. Todos los derechos reservados.
