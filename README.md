# GTools Academy

Academia web de herramientas de Google construida con HTML, CSS, JavaScript y PHP. El catálogo vive en `data/courses.json`; la página principal carga los cursos desde `api/courses.php` y las páginas individuales se generan en `curso.php`.

## Requisitos

- XAMPP con Apache y MySQL/MariaDB.
- PHP con las extensiones PDO MySQL y cURL habilitadas.
- Un cliente OAuth de tipo **Aplicación web** creado en Google Cloud.

## Ejecutar localmente

1. Inicia Apache y MySQL desde el panel de XAMPP.
2. Si es una instalación nueva, abre phpMyAdmin e importa `database/schema.sql`. Si ya tienes la base creada y ejecutaste la migración de preferencias, ejecuta una sola vez `database/migrations/002_course_enrollments.sql`. Si aún no actualizaste las preferencias, ejecuta primero `001_user_preferences.sql` y luego `002_course_enrollments.sql`, desde la pestaña **SQL** de phpMyAdmin.
3. En PowerShell, desde la raíz del proyecto, crea tu configuración local:

   ```powershell
   Copy-Item config\config.example.php config\config.php
   ```

4. Edita `config/config.php` con el ID y el secreto de OAuth de Google. El usuario/contraseña de MySQL deben coincidir con la configuración local de XAMPP.
5. En Google Cloud Console, configura la pantalla de consentimiento y agrega como usuarios de prueba las cuentas que usarán el login mientras la aplicación esté en modo de pruebas.
6. En el cliente OAuth de tipo **Aplicación web**, agrega como URI de redireccionamiento autorizada exactamente la URL de `redirect_uri` en `config/config.php`. La plantilla propone:

   ```text
   http://127.0.0.1/google_tools/api/auth.php?action=callback
   ```

   Debe coincidir con la dirección que utilizas para abrir el sitio. Si el directorio se sirve como `/Google_tools/`, actualiza la URI en ambos lugares (la configuración local y Google Cloud).
7. Abre `http://127.0.0.1/google_tools/` y prueba el inicio de sesión.

`config/config.php` está excluido de Git. No publiques ni incluyas el secreto de OAuth en JavaScript, HTML, capturas o commits.

## Autenticación y progreso

El inicio de sesión utiliza OAuth de Google en el servidor: el backend protege el intercambio con `state` y PKCE, consulta el perfil verificado a Google y mantiene la cuenta mediante una sesión PHP. El navegador no recibe el secreto del cliente OAuth ni el token de acceso.

El botón **Registrarse** crea el perfil local asociado a la cuenta de Google. **Iniciar sesión** solo permite cuentas ya registradas; si la cuenta no existe, el sitio pide registrarse primero.

Los detalles básicos, las habilidades y el material de cada curso son públicos. Para ver videos, actividades y progreso, el usuario debe inscribirse con su cuenta de Google; si aún no inició sesión, la inscripción se crea al regresar del flujo de Google. Las inscripciones y los cursos completados se guardan por separado en MySQL; el acceso al contenido y el guardado de progreso requieren una inscripción. Una inscripción puede cancelarse mientras el curso no esté completado; los cursos completados no se pueden cancelar. Los cursos que ya estaban completados se migran automáticamente como inscritos. Esta primera etapa no guarda el módulo o video exacto en el que se quedó el usuario.

Se almacenan el identificador de Google, correo, nombre, foto de perfil y fecha de finalización por curso. La pantalla de Google debe estar en modo de pruebas y autorizar las cuentas del equipo hasta que se decida publicar la aplicación. Para producción, usa HTTPS, una base de datos con un usuario de privilegios limitados y las URI de redireccionamiento del dominio desplegado.

Al iniciar sesión, el avatar abre el menú de cuenta. **Administrar tu cuenta** abre `profile.html` en la misma pestaña. Cuando hay sesión, el idioma y el tema se guardan en MySQL para esa cuenta y se cargan al iniciar sesión desde otro dispositivo. Para visitantes sin sesión, las preferencias se guardan localmente en el navegador.
