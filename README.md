# Plan de Claudia · Media Maratón de Lima 2027

Sitio estático (HTML + CSS + JavaScript, sin dependencias). Los archivos van en la raíz del repositorio.

## Publicar
1. Subir todos los archivos a un repositorio de GitHub.
2. En Vercel: *Add New → Project*, elegir el repositorio y desplegar.
   Framework preset: **Other**. No hay build ni carpeta de salida especial.

## Actualizar el plan
Todo el contenido está al inicio de `app.js`:
- `WEEKS`: cada semana es un objeto. Para agregar la semana 2, se copia el objeto de la semana 1 y se cambian `id`, `title`, `range`, `start` y los días. El sitio muestra automáticamente la semana que corresponde a la fecha de hoy y agrega flechas para navegar.
- `PHASES` y `MONTHS`: fases y mes a mes.
- `STRENGTHS` y `CHALLENGES`: la sección "Lo mejor de mí y mi reto".
- `RACE`: fecha y hora de la carrera para la cuenta regresiva.

Las sesiones marcadas se guardan en el celular de Claudia (localStorage).
