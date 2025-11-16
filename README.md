# TeleGuard - Bot de Telegram con Gestión de Suscripciones

Backend en Node.js con Express para gestionar usuarios de un bot de Telegram con suscripciones temporales.

## 🚀 Características

- ✅ API REST para gestión de usuarios
- ✅ Bot de Telegram integrado
- ✅ Sistema automático de expulsión por vencimiento de suscripción
- ✅ Verificación periódica con cron jobs
- ✅ Notificaciones automáticas de expiración
- ✅ Soporte para duraciones de pago variables
- ✅ Dashboard Astro para administración

## 📋 Requisitos

- Node.js >= 18.0.0
- MongoDB
- Cuenta de Telegram con acceso a la API de Usuario (API ID y API Hash)
- Número de teléfono vinculado a Telegram

## 🛠️ Instalación

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Configurar .env con tus credenciales
```

## ⚙️ Configuración

Edita el archivo `.env` con tus credenciales:

```env
TELEGRAM_API_ID=25798572
TELEGRAM_API_HASH="ed018f88a51c893aff0e90d6a25bb313"
TELEGRAM_PHONE_NUMBER="+34612345678"
TELEGRAM_GROUP_ID="-1001234567890"
API_SECRET=tu_clave_secreta
MONGODB_URI=tu_uri_de_mongodb
```

### Obtener API ID y API Hash

1. Ve a [my.telegram.org](https://my.telegram.org)
2. Inicia sesión con tu número de teléfono
3. Ve a "API Development Tools"
4. Crea una nueva aplicación si no tienes una
5. Copia el `api_id` y `api_hash`

### Obtener Group ID

1. Agrega tu cuenta al grupo que quieres gestionar
2. Usa bots como [@userinfobot](https://t.me/userinfobot) en el grupo
3. El bot te dará el ID del grupo (formato: `-1001234567890`)

### Primera vez - Autenticación

La primera vez que ejecutes el servidor, necesitarás autenticarte:

```bash
pnpm dev
```

Se te pedirá:
- Número de teléfono (si no está en .env)
- Código de verificación que recibes por Telegram
- Contraseña 2FA (si la tienes configurada)

La sesión se guardará en `telegram_session.txt` para no pedir autenticación nuevamente.

## 🚀 Uso

### Desarrollo

```bash
# Backend
pnpm dev

# Frontend (Dashboard Astro)
pnpm dev:astro
```

### Producción

```bash
# Compilar
pnpm build

# Iniciar
pnpm start
```

## 📡 API Endpoints

### Autenticación

Todas las rutas requieren el header:
```
X-API-Key: tu_api_secret
```

### Usuarios

#### Listar usuarios
```http
GET /api/users
GET /api/users?active=true
GET /api/users?expired=true
```

#### Obtener usuario
```http
GET /api/users/:id
```

#### Crear usuario
```http
POST /api/users
Content-Type: application/json

{
  "telegramId": "123456789",
  "firstName": "Juan",
  "lastName": "Pérez",
  "username": "juanperez",
  "paymentDurationDays": 30,
  "notes": "Cliente premium"
}
```

#### Actualizar usuario
```http
PUT /api/users/:id
Content-Type: application/json

{
  "paymentDurationDays": 60,
  "isActive": true
}
```

#### Extender suscripción
```http
POST /api/users/:id/extend
Content-Type: application/json

{
  "additionalDays": 30
}
```

#### Eliminar usuario
```http
DELETE /api/users/:id
```

#### Estadísticas
```http
GET /api/users/stats
```

## 🤖 Funcionalidad del Bot

El sistema usa la **Telegram User API** (no Bot API), lo que permite:

- ✅ Expulsar usuarios del grupo sin necesidad de ser bot
- ✅ Mayor control sobre el grupo
- ✅ Enviar mensajes directos a usuarios
- ✅ Acceso completo a la API de Telegram

**Nota:** El sistema necesita que tu cuenta de Telegram esté autenticada y tenga permisos de administrador en el grupo.

## ⏰ Cron Job

El sistema verifica automáticamente cada 6 horas (configurable):

- Usuarios con suscripción vencida → Expulsa del grupo
- Usuarios a 3 días de expirar → Notifica
- Usuarios a 1 día de expirar → Notifica urgente

## 🌐 Deploy

### Vercel

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

Configurar en Vercel:
- Build Command: `pnpm build`
- Output Directory: `dist`
- Environment Variables: Agregar todas las del `.env`

### Render

1. Conecta tu repositorio en [Render](https://render.com)
2. Selecciona "Web Service"
3. Build Command: `pnpm build`
4. Start Command: `pnpm start`
5. Agregar variables de entorno

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```

## 📦 Estructura del Proyecto

```
TeleGuard/
├── src/
│   ├── server.ts              # Servidor Express principal
│   ├── models/
│   │   └── User.model.ts      # Modelo de usuario con Mongoose
│   ├── controllers/
│   │   └── user.controller.ts # Controladores de API
│   ├── routes/
│   │   └── user.routes.ts     # Rutas de API
│   ├── services/
│   │   ├── telegram.service.ts # Integración con Telegram
│   │   └── cron.service.ts    # Tareas programadas
│   ├── middlewares/
│   │   ├── auth.middleware.ts # Autenticación API
│   │   └── validation.middleware.ts # Validación de datos
│   └── pages/                 # Dashboard Astro
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Seguridad

- Todos los endpoints están protegidos con API Key
- Las credenciales deben estar en variables de entorno
- No commitear archivos `.env` ni `telegram_session.txt`
- La sesión de Telegram se guarda localmente y debe mantenerse segura

## 📝 Notas

- MongoDB debe estar disponible antes de iniciar el servidor
- Tu cuenta de Telegram debe tener permisos de administrador en el grupo
- Los usuarios son expulsados automáticamente al vencer su suscripción
- Las notificaciones se envían 3 días y 1 día antes de expirar
- La sesión de Telegram se mantiene activa entre reinicios
- **Importante:** Este sistema usa tu cuenta de Telegram personal, no un bot

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT

## 👤 Autor

Sebastian Parra (@urfavsebxs)
