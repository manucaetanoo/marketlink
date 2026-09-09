# Meta Pixel de Afilink

Pixel del navegador: `3610569409082578`. No utiliza variables de entorno,
tokens secretos ni API de conversiones.

## Implementación

- `app/layout.tsx`: componente global dentro de Suspense y política no-referrer
  para evitar propagar URLs sensibles como referencia al salir de ellas.
- `components/MetaPixelNoscript.tsx`: beacon renderizado en HTML, sin optimización
  de imágenes ni cabecera Referer; excluye las páginas con tokens.
- `components/MetaPixel.tsx`: carga única de fbevents.js mediante next/script,
  afterInteractive; observa pathname y query del App Router.
- `lib/meta-pixel.ts`: cola compatible con fbq, inicialización única,
  autoConfig desactivado y eventos tipados sin parámetros de usuario.
  El último destino se conserva fuera de React para evitar repeticiones de
  efectos/remontajes. Volver de B a A sí cuenta como una visita nueva.
- `app/api/auth/register/route.ts`: created=true únicamente en la respuesta
  201 posterior a la creación y al envío de la verificación. Una cuenta
  existente recibe created=false y no genera otra conversión.
- `app/register/page.tsx`: emite CompleteRegistration después de recibir
  201, created=true y role=AFFILIATE. Bloquea solicitudes simultáneas y
  nuevos envíos desde el formulario que ya recibió éxito. No se emite
  desde un efecto, una pantalla de confirmación o una redirección.

Para añadir eventos, ampliar MetaPixelEvent y usar trackMetaEvent. Cualquier
parámetro futuro debe tener un esquema específico sin datos personales;
no pasar objetos de usuario ni respuestas completas como parámetros de fbq.

## Probar eventos en Meta

1. Publicar esta versión o ejecutar una instancia local accesible desde el
   mismo navegador utilizado para Meta. Desactivar bloqueadores para la prueba.
2. En Administrador de eventos, seleccionar el origen de datos con ID
   3610569409082578 y abrir Probar eventos.
3. En la prueba de eventos del navegador, introducir la URL del sitio y
   abrirla usando el botón de Meta. No hace falta un test_event_code de servidor.
4. Confirmar un PageView inicial. Navegar usando enlaces internos: uno por
   destino, incluyendo cambios de query. Atrás/adelante cuenta una visita nueva;
   rerenders y router.refresh del mismo destino no añaden otra.
5. Abrir /register: solo PageView. Crear un afiliado con un email de prueba
   nuevo: debe aparecer un CompleteRegistration después del POST 201.
6. Errores de validación, respuestas fallidas, email ya registrado y reenvío
   de verificación no deben generar CompleteRegistration. Refrescar la
   confirmación o seguir el enlace de verificación tampoco debe repetirlo.
7. Comprobar en los detalles que el origen es navegador y que no hay parámetros
   personalizados con email, nombre, contraseña o identificador del usuario.
8. Mantener desactivadas la coincidencia avanzada automática y las reglas
   automáticas de eventos en Meta; eliminar cualquier regla externa que envíe
   CompleteRegistration por clic o por URL. No instalar este mismo píxel en GTM.

El noscript solo se solicita con JavaScript desactivado. Con JavaScript activo,
no genera un PageView adicional. Los bloqueadores o un fallo de red pueden
impedir la entrega: las comprobaciones locales no acreditan recepción en Meta.

## Privacidad

No se pasan datos personales del formulario ni datos de coincidencia avanzada.
Esto no significa que el SDK no recoja información por su cuenta: el píxel
del navegador utiliza metadatos, cookies y la URL del documento. Las páginas
/verify-email y /reset-password reciben tokens en la query y se excluyen del
script, los eventos y el noscript por decisión del usuario. La política global
no-referrer impide que esas URLs se propaguen como referencia en nuevas cargas
de documentos. No se ha modificado el flujo de autenticación. Una librería ya
cargada durante una navegación interna permanece en memoria, pero nuestros
helpers no emiten eventos desde las rutas excluidas y autoConfig está desactivado.
No colocar datos personales ni secretos en las URLs de otras páginas medidas.

## Verificación local

```sh
node scripts/check-meta-pixel.mjs
npx tsc --noEmit
npm run lint
npm run build
```

Las pruebas simulan fbq y fetch: no envían eventos, crean usuarios ni mandan
correos. Cubren inicialización, cola, repetición de efectos, navegación de
regreso/query, guardas de estado/rol, ausencia de datos personales en argumentos,
doble envío, respuestas HTTP fallidas y reintentos tras fallos de red.
