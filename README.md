<div align="center">

# 🛡️ TeleGuard

### Sistema de Gestión de Suscripciones para Grupos de Telegram

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Astro](https://img.shields.io/badge/Astro-5.15-FF5D01?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Características](#-características) •
[Instalación](#️-instalación) •
[Configuración](#️-configuración) •
[Uso](#-uso) •
[API](#-api-endpoints) •
[Deploy](#-deploy)

</div>

---

## 📖 Descripción

**TeleGuard** es una plataforma completa de gestión de suscripciones para grupos de Telegram. Permite administrar usuarios con suscripciones temporales, expulsar automáticamente usuarios vencidos, enviar notificaciones programadas y gestionar todo desde un elegante dashboard web.

El sistema utiliza la **Telegram User API** (no Bot API), lo que proporciona control total sobre el grupo sin necesidad de un bot dedicado.

> 💼 **¿Necesitas este sistema configurado para tu grupo?** Este servicio está disponible para contratación. Incluye instalación, configuración personalizada y soporte técnico. Contáctame para más información.

### ✨ ¿Por qué TeleGuard?

- 🎯 **Control Total**: Gestiona tu grupo de Telegram desde una interfaz web moderna
- ⚡ **Automatización**: Expulsión automática de usuarios con suscripción vencida
- 📊 **Dashboard Intuitivo**: Visualiza estadísticas, gestiona usuarios con un click
- 🔔 **Notificaciones**: Alertas automáticas antes de que expire la suscripción
- 📱 **Multi-select**: Elimina múltiples usuarios a la vez
- 🔄 **Sincronización**: Importa usuarios existentes del grupo con su fecha real de ingreso
- 📅 **Gestión de Días**: Extiende o reduce días de suscripción individualmente

---

## 🚀 Características

### Backend (Express + TypeScript)

- ✅ **API REST completa** con autenticación mediante API Key
- ✅ **Integración Telegram** usando gramJS (User API)
- ✅ **Cron Jobs** para verificación automática de suscripciones
- ✅ **MongoDB** para persistencia de datos
- ✅ **Sistema de notificaciones** automáticas
- ✅ **Gestión de usuarios** (CRUD completo)
- ✅ **Expulsión automática** de usuarios vencidos
- ✅ **Links de invitación** automáticos al reactivar usuarios
- ✅ **Cálculo dinámico** de días restantes en tiempo real

### Frontend (Astro + TailwindCSS)

- ✅ **Dashboard moderno** con diseño responsive
- ✅ **Login seguro** con autenticación JWT
- ✅ **Gestión visual** de usuarios
- ✅ **Estadísticas en tiempo real** (activos, expirados, próximos a vencer)
- ✅ **Multi-select** para operaciones en lote
- ✅ **Sincronización con Telegram** (con fecha actual o fecha de ingreso real)
- ✅ **Extender/Reducir** días de suscripción individualmente
- ✅ **Dark mode** elegante

---

## 🛠️ Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Node.js** | 18+ | Runtime de JavaScript |
| **TypeScript** | 5.3 | Lenguaje tipado |
| **Express** | 4.21 | Framework web |
| **MongoDB** | 8.0 | Base de datos NoSQL |
| **Mongoose** | 8.0 | ODM para MongoDB |
| **gramJS** | 2.25 | Cliente de Telegram User API |
| **node-cron** | 3.0 | Tareas programadas |
| **JWT** | 9.0 | Autenticación |

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| **Astro** | 5.15 | Framework web moderno |
| **TailwindCSS** | 4.1 | Framework CSS utility-first |
| **TypeScript** | 5.3 | Lenguaje tipado |

---

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **MongoDB** (local o Atlas)
- **Cuenta de Telegram** con:
  - API ID y API Hash ([my.telegram.org](https://my.telegram.org))
  - Número de teléfono vinculado
  - Permisos de administrador en el grupo a gestionar

---

## ⚙️ Instalación

```bash
# Clonar repositorio
git clone https://github.com/urfavsebxs/TeleGuard.git
cd TeleGuard

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

---

## 🔧 Configuración

### 1. Variables de Entorno

Edita `.env` con tus credenciales:

```env
# Servidor
NODE_ENV=production
PORT=3000

# MongoDB
MONGODB_URI="mongodb+srv://usuario:password@cluster.mongodb.net/"

# Telegram User API
TELEGRAM_API_ID=25798572
TELEGRAM_API_HASH="tu_api_hash"
TELEGRAM_PHONE_NUMBER="+34612345678"
TELEGRAM_GROUP_ID="-1003266270558"
TELEGRAM_SESSION_STRING="tu_sesion_de_telegram"

# Seguridad
API_SECRET="clave_secreta_generada"

# CORS (opcional)
CORS_ORIGIN="https://tu-dominio.com"

# Cron Job
CHECK_INTERVAL_HOURS=6
```

### 2. Obtener Credenciales de Telegram

#### API ID y API Hash
1. Ve a [my.telegram.org](https://my.telegram.org)
2. Inicia sesión con tu número de teléfono
3. Ve a **"API Development Tools"**
4. Crea una nueva aplicación
5. Copia `api_id` y `api_hash`

#### Group ID
1. Crea tu bot con bot father [@botfather]
2. Ingresalo al grupo donde quieres extraer el ID
3. Mediante la siguiente API (https://api.telegram.org/bot%7BTokenDeTuBot%7D/getUpdates) el bot te dara el resultado como un JSON
4. El bot te mostrará el ID del grupo (formato: `-1003266270558`)

#### Session String
1. Ejecuta `pnpm dev` localmente
2. Autentica con QR o código de verificación
3. Se generará `telegram_session.txt`
4. Copia su contenido a `TELEGRAM_SESSION_STRING`

### 3. Crear Usuario Administrador

```bash
pnpm create:admin
```

Esto creará un usuario `admin` (cambialo si gustas) con contraseña hasheada `admin123` (cámbiala después).

---

## 🚀 Uso

### Modo Desarrollo

```bash
# Backend + Frontend
pnpm dev

# Solo Backend
pnpm dev

# Solo Frontend
pnpm dev:astro
```

Accede a:
- **Frontend**: http://localhost:4321
- **Backend API**: http://localhost:3000
- **Dashboard**: http://localhost:4321/dashboard

### Modo Producción

```bash
# Compilar
pnpm build

# Iniciar
pnpm start
```

---

## 📡 API Endpoints

### Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/users` | Listar todos los usuarios |
| `GET` | `/api/users?active=true` | Usuarios activos |
| `GET` | `/api/users?expired=true` | Usuarios expirados |
| `GET` | `/api/users/:id` | Obtener usuario específico |
| `GET` | `/api/users/stats` | Estadísticas generales |
| `POST` | `/api/users` | Crear usuario |
| `PUT` | `/api/users/:id` | Actualizar usuario |
| `POST` | `/api/users/:id/extend` | Extender suscripción |
| `POST` | `/api/users/:id/reduce` | Reducir días |
| `DELETE` | `/api/users/:id` | Eliminar usuario |

### Sincronización

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/sync/group` | Sincronizar con fecha actual |
| `POST` | `/api/sync/group/join-date` | Sincronizar con fecha de ingreso real |

---

## 📁 Estructura del Proyecto

```
TeleGuard/
├── src/
│   ├── server.ts                    # Servidor Express principal
│   ├── components/
│   │   └── Login.astro             # Componente de login
│   ├── controllers/
│   │   ├── auth.controller.ts      # Controlador de autenticación
│   │   ├── sync.controller.ts      # Controlador de sincronización
│   │   └── user.controller.ts      # Controlador de usuarios
│   ├── layouts/
│   │   └── Layout.astro            # Layout principal
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # Middleware de autenticación
│   │   └── validation.middleware.ts # Middleware de validación
│   ├── models/
│   │   ├── Admin.model.ts          # Modelo de administrador
│   │   └── User.model.ts           # Modelo de usuario
│   ├── pages/
│   │   ├── index.astro             # Página de login
│   │   └── dashboard.astro         # Dashboard principal
│   ├── routes/
│   │   ├── auth.routes.ts          # Rutas de autenticación
│   │   ├── sync.routes.ts          # Rutas de sincronización
│   │   └── user.routes.ts          # Rutas de usuarios
│   ├── scripts/
│   │   └── create-admin.ts         # Script para crear admin
│   ├── services/
│   │   ├── cron.service.ts         # Tareas programadas
│   │   └── telegram.service.ts     # Integración con Telegram
│   ├── styles/
│   │   └── global.css              # Estilos globales
│   └── types/
│       └── input.d.ts              # Tipos TypeScript
├── dist/                            # Archivos compilados
│   ├── client/                      # Frontend compilado
│   └── *.js                         # Backend compilado
├── .env                             # Variables de entorno (no commitear)
├── .env.example                     # Ejemplo de variables
├── .gitignore                       # Archivos ignorados por Git
├── astro.config.mjs                 # Configuración de Astro
├── package.json                     # Dependencias del proyecto
├── pnpm-lock.yaml                   # Lock file de pnpm
├── README.md                        # Este archivo
├── render.yaml                      # Configuración de Render
├── tsconfig.backend.json            # TypeScript config para backend
└── tsconfig.json                    # TypeScript config para frontend
```

---

## 🌐 Deploy

### Render (Recomendado)

1. **Fork** este repositorio
2. Crea un nuevo **Web Service** en [Render](https://render.com)
3. Conecta tu repositorio
4. Render detectará automáticamente `render.yaml`
5. **Agrega las variables de entorno** en el dashboard
6. Deploy automático ✨

**Variables de entorno requeridas en Render:**
```
NODE_ENV=production
PORT=3000
MONGODB_URI=tu_mongodb_uri
TELEGRAM_API_ID=tu_api_id
TELEGRAM_API_HASH=tu_api_hash
TELEGRAM_PHONE_NUMBER=tu_numero
TELEGRAM_GROUP_ID=tu_group_id
TELEGRAM_SESSION_STRING=tu_sesion
API_SECRET=tu_secreto
CHECK_INTERVAL_HOURS=6
```

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login y deploy
railway login
railway up
```

### Vercel (Solo Frontend)

⚠️ Vercel no soporta procesos persistentes (cron jobs), solo para el frontend.

---

## 🔒 Seguridad

- 🔐 Todos los endpoints protegidos con autenticación
- 🔑 API Keys y JWT para acceso seguro
- 🚫 Sesiones de Telegram encriptadas
- ⚠️ **Nunca commitear** `.env` o `telegram_session.txt`
- 🔒 CORS configurable para producción

---

## 🤖 Funcionamiento del Sistema

### Cron Job Automático

Cada **6 horas** (configurable), el sistema:

1. ✅ Verifica todos los usuarios
2. 📧 Notifica a usuarios **próximos a vencer** (3 días, 1 día)
3. 🚫 **Expulsa automáticamente** usuarios con suscripción vencida
4. 📊 Actualiza estadísticas

### Días Restantes (Virtual Field)

El sistema calcula automáticamente los días restantes usando un **virtual field** de Mongoose:

```typescript
daysRemaining = Math.ceil((expirationDate - now) / 86400000)
```

Esto significa que los días se actualizan automáticamente sin necesidad de re-sincronizar.

### Sincronización con Telegram

**Dos modos disponibles:**

1. **Fecha actual**: Todos reciben 30 días desde ahora
2. **Fecha de ingreso real**: Calcula días restantes desde su fecha de ingreso al grupo

---

## 📸 Capturas

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Login
![Login](https://via.placeholder.com/400x300?text=Login+Screenshot)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. **Fork** el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -m 'feat: Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un **Pull Request**

---

## 👤 Autor

**Sebastian Parra**
- GitHub: [@urfavsebxs](https://github.com/urfavsebxs)
- Email: devsebitas@gmail.com

---

## 💼 Servicios

¿Necesitas implementar TeleGuard para tu grupo de Telegram pero no tienes tiempo o conocimientos técnicos? 

**Ofrezco servicios de:**
- ✅ Instalación y configuración completa
- ✅ Personalización según tus necesidades
- ✅ Deploy en servidores (Render, Railway, VPS)
- ✅ Capacitación para el uso del dashboard
- ✅ Soporte técnico y mantenimiento
- ✅ Integraciones adicionales (pagos, webhooks, etc.)

**📧 Contacto:** devsebitas@gmail.com  
**💬 Telegram:** [@urfavsebxs](https://t.me/urfavsebxs)

---

## 🙏 Agradecimientos

- [gramJS](https://github.com/gram-js/gramjs) - Cliente de Telegram para Node.js
- [Astro](https://astro.build) - Framework web moderno
- [TailwindCSS](https://tailwindcss.com) - Framework CSS utility-first
- [MongoDB](https://www.mongodb.com) - Base de datos NoSQL

---

<div align="center">

**⭐ Si te gusta este proyecto, dale una estrella en GitHub! ⭐**

[🐛 Reportar Bug](https://github.com/urfavsebxs/TeleGuard/issues) • 
[✨ Solicitar Feature](https://github.com/urfavsebxs/TeleGuard/issues) • 
[❓ FAQ](https://github.com/urfavsebxs/TeleGuard/wiki)

</div>
