# METALFAST Campo · Demo

Demo web mobile first de documentación de obra, creada para explorar tres necesidades: permisos HSE, informes de vehículos y reportes de calidad con seguimiento de firmas.

**Todos los registros iniciales son ficticios.** Las aprobaciones, firmas y envíos son estados de demostración. No se conectan portales GPS ni se efectúan autorizaciones HSE o firmas reales.

## Desarrollo

Requiere Node.js 22.12+ y npm o pnpm.

```sh
npm install
npm run dev
npm run build
```

El build se genera en `docs/`. En GitHub Pages seleccionar `main` y carpeta `/docs`. `base: './'` permite publicar bajo el nombre del repositorio.

## Datos

Los documentos y adjuntos se guardan en IndexedDB dentro del navegador que los carga. No existe sincronización entre dispositivos, autenticación de usuarios ni backend. La demo cuenta con opción para restablecer los datos ficticios. No utilizar documentos sensibles en esta demostración pública.

## Funciones

- Buscar y filtrar documentos por módulo, obra, período o estado.
- Crear permisos HSE y gestionar estados de ejemplo.
- Importar reportes `.xlsx` o `.csv` basados en la plantilla y agruparlos por vehículo/período.
- Cargar documentos y fotografías desde la cámara del teléfono.
- Seguir dos revisiones/firmas simuladas en documentos de calidad.
- Descargar adjuntos originales o generar un resumen PDF de demostración.

Los formatos concretos de Microtrack, RSV y Full Control se incorporarán después de revisar archivos reales anonimizados. La cámara depende de permisos y compatibilidad del navegador.

