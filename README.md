# Colmotica - Backend (Proyecto)

Este repositorio contiene el backend de la aplicación Colmotica, escrito en TypeScript sobre Express y MariaDB. Este README describe la estructura del proyecto dentro de `src/`, los endpoints principales y cómo ejecutar la aplicación en desarrollo.

Contenido principal

- `package.json` - Scripts y dependencias.
- `tsconfig.json` - Configuración de TypeScript.
- `src/app.ts` - Punto de entrada del servidor (Express).
- `src/controller/` - Controladores que exponen rutas y orquestan servicios y modelos.
- `src/model/` - Modelos y validaciones que interactúan con la base de datos (MariaDB).
- `src/services/` - Servicios reutilizables (encriptación, envíos de correo, lógica compartida).
- `src/util/` - Utilidades pequeñas (p. ej. convertir bigint a string).

Estructura y responsabilidades (detallado)

- `src/app.ts`

  - Configura Express, CORS y body-parser.
  - Importa los controladores:
    - `controller_users` -> rutas relacionadas con usuarios (registro, login, recuperación de contraseña, verificación de código, CRUD básico).
    - `controller_manuals` -> rutas para gestionar manuales y solicitudes de usuarios.
    - `controller_admins` -> rutas para crear y listar administradores.
  - Las rutas se montan bajo el prefijo `/colmotica`.

- `src/controller/controller_users/cUsers.ts`

  - Rutas principales:

    - POST `/colmotica/users` — Registrar usuario.
    - GET `/colmotica/users` — Listar usuarios.
    - POST `/colmotica/users/login` — Login de usuario.
    - POST `/colmotica/users/verify-code` — Verificar código (envío desde email).
    - PATCH `/colmotica/users/update/:idUser` — Actualizar usuario.
    - DELETE `/colmotica/users/delete/:idUser` — Eliminar usuario.
    - POST `/colmotica/users/sendcode` — Enviar código de recuperación.
    - POST `/colmotica/users/recover-pass` — Recuperar/actualizar contraseña.

  - Valida entradas con esquemas ubicados en `src/model/validations/schemas.ts`.
  - Interactúa con el modelo `mUser` en `src/model/mariadb/model_user/modelUser`.
  - Usa `sColmoticaService` (hash/validación de contraseñas) y `sMailService` para envíos de correo y verificación.

- `src/controller/controller_manuals/cManuals.ts`

  - Rutas principales:

    - POST `/colmotica/users/manuals` — Agregar un manual.
    - GET `/colmotica/users/manuals` — Listar manuales.
    - POST `/colmotica/manuals/req` — Solicitar un manual para un usuario.
    - GET `/colmotica/manuals/req/pendiente` — Listar solicitudes pendientes.
    - GET `/colmotica/manuals/req/total` — Obtener número total de solicitudes.
    - PATCH `/colmotica/manuals/req/aprobado` — Marcar solicitud como aprobada y notificar.
    - PATCH `/colmotica/manuals/req/rechazado` — Rechazar solicitud y notificar.

  - Utiliza el modelo `mManuals` y la utilidad `fixBigInt` para convertir bigint al serializar.

- `src/controller/controller_admins/cAdmins.ts`

  - Rutas principales:
    - POST `/colmotica/users/admin` — Crear administrador.
    - GET `/colmotica/users/admin` — Listar administradores.

- `src/model/Interfaces/interfaces.ts`

  - Contiene interfaces TypeScript usadas por los modelos y controladores: `user`, `userUp`, `userLogin`, `codeVerification`, `manuals`, `logManuals`, `admins`, `manuals_VS_users`.

- `src/util/utils.ts`
  - `fixBigInt(data)` — Convierte valores bigint a strings durante la serialización JSON.

Cómo ejecutar

Requisitos previos:

- Node.js (versiones recientes), npm.
- Base de datos MariaDB configurada y accesible según los archivos de conexión en `src/model/mariadb/conexion_mariadb.ts`.
- Variables de entorno definidas (ver archivo `.env` si existe). Las variables típicas: `PORT`, credenciales DB, configuración de correo.

Comandos útiles:

En desarrollo (recomendado):

```pwsh
npm install
npm run dev
```

Construir y ejecutar la versión compilada:

```pwsh
npm run build
npm start
```

Notas de implementación y comportamiento

- El servidor monta todas las rutas bajo `/colmotica`. Por ejemplo, registrar un usuario es POST `/colmotica/users`.
- Validaciones de entrada usan Zod (vía `src/model/validations/schemas.ts`) — las respuestas 422 se usan para datos inválidos.
- El proyecto usa `sColmoticaService` para operaciones criptográficas (hash/compare) y `sMailService` para envíos de correos y verificación mediante códigos.
- Las respuestas de error del servidor devuelven 500 con mensajes genéricos; los controladores registran errores en consola para debugging.

Próximos pasos sugeridos (opcionales)

- Añadir un archivo `.env.example` con las variables necesarias.
- Documentar los modelos en `src/model/mariadb` (p. ej. describir tablas esperadas y SQL).
- Añadir tests unitarios para controladores y validaciones.
- Añadir un README más detallado por cada módulo (por ejemplo `src/services/`).

Contacto

Si necesitas que genere documentación más detallada (postman collection, ejemplos de peticiones, o agregar `.env.example`), dime y lo añado.
