# Basquet Stats — Frontend

Interfaz web de Basquet Stats: una plataforma de gestión y análisis de estadísticas de básquet, pensada desde mi doble perspectiva como técnico de básquet y estudiante de IA.

🔗 **Demo en vivo:** https://basquet-stats-frontend.vercel.app/
🔗 **Repo del backend:** https://github.com/bethoven996/Bask_estadisticas

## Funcionalidades

- 📊 Tabla de jugadores con filtros por equipo, posición y búsqueda por nombre, con paginación
- 🏀 Perfiles de jugador con foto (real cuando está disponible en Wikipedia), datos físicos, evolución de rendimiento y distribución de tiros
- ⚖️ Comparar hasta 3 jugadores o equipos lado a lado, con gráficos
- 🤝 Historial de enfrentamientos directos entre equipos
- 🔐 Login con JWT: cualquiera puede ver las estadísticas, solo usuarios autenticados pueden cargar o borrar datos
- 📄 Exportar el perfil de un jugador a PDF
- ➕ Carga de jugadores y partidos nuevos desde la interfaz, con estadísticas iniciales opcionales

## Stack

- **React** + **Vite**
- **Recharts** — gráficos
- **Axios** — pedidos al backend
- **jsPDF** — generación de PDFs
- Diseño propio (sin librerías de UI), con identidad visual inspirada en una cancha de básquet

## Correr en local

```bash
git clone https://github.com/bethoven996/basquet-stats-frontend.git
cd basquet-stats-frontend
npm install
```

Creá un archivo `.env` en la raíz con:VITE_API_URL=http://localhost:8000

(Apuntá esto a la URL de tu [backend](https://github.com/bethoven996/Bask_estadisticas) corriendo en local, o a `https://bask-estadisticas.onrender.com` para usar los datos de producción.)

```bash
npm run dev
```

## Capturas

<!-- Agregá acá 2-3 capturas del proyecto: la tabla principal, un perfil de jugador, y la comparación -->

## Autor

Norberto "Beto" Narváez — [LinkedIn]https://www.linkedin.com/in/betonarvaez/
