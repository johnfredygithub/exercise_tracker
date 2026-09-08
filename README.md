# ExerciseTrackerFree 🏋️‍♂️

Lleva un control preciso de tus repeticiones y tu progreso diario con una interfaz moderna, fácil de usar y **totalmente gratuita**.

🔗 **Demo en vivo:** [exercise-tracker-lovat-gamma.vercel.app](https://exercise-tracker-lovat-gamma.vercel.app/)

---

## ✨ Características

- **Seguimiento diario** — Registra tus repeticiones cada día y no pierdas tu progreso.
- **Historial de ejercicios** — Consulta qué ejercicios has realizado y cuántas repeticiones.
- **Calendario visual** — Visualiza tus días activos con un calendario interactivo.
- **Estadísticas** — Consulta tu progreso semanal y mensual con métricas precisas.
- **Autenticación integrada** — Inicia sesión de forma segura para guardar tu progreso.

## 🎥 Demo

Puedes ver una demostración de la aplicación en el sitio en vivo, en la sección `/demo.mp4`.

## 🚀 Empezar

### Requisitos previos

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- npm, yarn o pnpm
- Variables de entorno configuradas para autenticación (ver `.env.example` si está disponible)

### Instalación

```bash
# Clona el repositorio
git clone https://github.com/johnfredygithub/exercise_tracker.git
cd exercise_tracker

# Instala las dependencias
npm install
```

### Configuración

Crea un archivo `.env.local` en la raíz del proyecto con las variables necesarias para la autenticación y la base de datos, por ejemplo:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secreto_aqui
DATABASE_URL=tu_cadena_de_conexion_aqui
```

> ⚠️ Ajusta estas variables según el proveedor de autenticación y base de datos que utilice el proyecto.

### Ejecución en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### Build de producción

```bash
npm run build
npm start
```

## 🛠️ Tecnologías

- **Frontend/Backend:** Next.js (React)
- **Autenticación:** NextAuth.js
- **Despliegue:** Vercel

> 📝 Nota: este stack se infiere de la estructura del sitio desplegado. Ajusta esta sección si el proyecto usa otras tecnologías (framework, base de datos, ORM, etc.).

## 📂 Estructura del proyecto

```
exercise_tracker/
├── pages/ o app/       # Rutas y páginas de la aplicación
├── components/         # Componentes reutilizables de la interfaz
├── public/              # Archivos estáticos (imágenes, demo.mp4, etc.)
└── ...
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si quieres colaborar:

1. Haz un fork del repositorio.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`).
3. Haz commit de tus cambios (`git commit -m 'Agrega nueva funcionalidad'`).
4. Haz push a tu rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## ☕ Apoya el proyecto

Si te gusta este proyecto, puedes invitar al autor a un café:
[buymeacoffee.com/johnfredy2000](https://buymeacoffee.com/johnfredy2000)

## 📄 Licencia

Este proyecto no especifica una licencia actualmente. Considera agregar un archivo `LICENSE` si planeas distribuirlo o recibir contribuciones externas.
