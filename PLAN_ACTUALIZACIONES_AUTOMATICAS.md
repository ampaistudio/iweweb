# Actualizaciones automáticas por tandas

Estado al 17 de noviembre de 2026.

## Interacción del operador

El operador dispone de **Actualizar ahora** y **Actualizaciones automáticas**. Ambas opciones usan el mismo ejecutor. La API sólo admite iniciar un ciclo o guardar el interruptor. La tabla de diagnóstico es informativa.

## Implementación local en iwe_test

El proceso `python3 scripts/local-maintenance.py` atiende la cola mientras está en ejecución. Requiere PHP con SQLite, Node, npm y el entorno de Playwright con Chrome de las pruebas existentes (`IWE_TEST_RUNTIME_PACKAGE`). La variante `--once` verifica un ciclo desde la terminal. Un bloqueo exclusivo impide dos ejecutores. SQLite guarda modo, solicitud, último ciclo y estado en el directorio privado configurado para respaldos. El modo automático comienza apagado y evalúa pendientes cada 24 horas, también al volver a arrancar si venció el plazo. En esta instalación el proceso se inicia por sesión.

El ejecutor toma las versiones directas de los archivos de bloqueo y consulta el registro npm. Prioriza las familias con avisos altos o críticos y luego las tandas con menos paquetes directos. Selecciona una línea menor por vez dentro de una versión mayor estable. Recalcula sobre los archivos de bloqueo aceptados tras cada tanda. Cada ciclo tiene un límite de 64 tandas. Las versiones mayores, inestables o anteriores a 1.0 quedan fuera de esta política.

Cada candidato se prepara en un directorio privado independiente con resolución estricta de pares. Una variación directa fuera de la tanda, un aviso alto o crítico, o un error de instalación, compilación o prueba detiene el ciclo. Las pruebas de navegador de recuperación y edición usan datos simulados. La activación local intercambia un único enlace a los dos builds y sus manifiestos. Una comprobación posterior fallida revierte ese enlace. Un registro de reversión permite recuperar una activación interrumpida al arrancar. Una edición posterior de las fuentes respecto de la versión activada requiere reconciliar la base de prueba.

El servidor de vista compilada se inicia con `IWE_LOCAL_RELEASES=1 php -S 127.0.0.1:8010 router.php`. Usa los builds locales como base hasta que se activa una tanda. Los servidores Vite siguen mostrando las fuentes de desarrollo.

Prueba del 17/11. El candidato prioritario quedó bloqueado por seis entradas altas o críticas del árbol web en npm audit. Se mantuvo la versión de partida y el automático apagado. Las pruebas de navegador sobre la base compilada pasaron. La reversión se verificó por inyección de fallo local.

## Comportamiento requerido del motor

1. Identificar el despliegue actual mediante un manifiesto de compilación, hashes y versiones. Los package.json del servidor por sí solos no acreditan la versión contenida en el JavaScript publicado.
2. Verificar un respaldo de archivos, configuración, medios y base de datos con una ruta de recuperación operativa. Conservar la versión que está atendiendo el sitio.
3. Resolver versiones candidatas con sus restricciones, peer dependencies, avisos de seguridad y compatibilidad de entorno. Conservar el archivo de bloqueo exacto del candidato.
4. Seleccionar una tanda mínima. Mantener juntos paquetes que necesitan compatibilidad mutua. Evaluar cambios de PHP y MySQL mediante un procedimiento propio. Ante datos insuficientes, registrar el motivo y detener esa tanda.
5. Preparar el candidato en un directorio aislado. Instalar y compilar allí. Ejecutar pruebas de seguridad y pruebas funcionales de web, menú, ficha, reservas, acceso al dashboard y edición.
6. Registrar resultados y artefactos de cada ejecución. Un fallo impide publicar el candidato. La versión anterior continúa atendiendo las solicitudes.
7. Publicar una versión completa de los artefactos de la tanda, con posibilidad de volver a la versión anterior. Comprobar también el sitio real y la CDN. Revertir los artefactos si falla la comprobación posterior.
8. Reevaluar el despliegue después de cada tanda antes de preparar la siguiente.

## Dos recorridos

En iwe_test se desarrolla y prueba el motor y se revisa su interfaz local.

Para mtbandorra.com se parte de una copia exacta de producción. Se conserva el contenido actual de la base de datos y los medios. Cada tanda de mantenimiento contiene únicamente los artefactos y cambios de esquema que necesita, con un plan específico cuando afecta datos persistentes. Las funcionalidades nuevas de iwe_test se publican en tandas propias después de validar su compatibilidad con producción.

## Pendientes exclusivos de producción

Validar un ejecutor de producción con Node y PHP que pueda preparar y probar candidatos, y un método de publicación reversible compatible con el alojamiento. Verificar las capacidades reales del hosting y del conector antes de implementar el botón de ejecución. El PHP que atiende una petición HTTP no debe instalar librerías ni reemplazar su propia instalación durante esa petición.

La auditoría de producción confirmó SSL activo y redirección HTTPS. Se observaron diferencias entre archivos publicados y test. El usuario informó que creó una copia de seguridad. La integridad y capacidad de restauración de esa copia todavía requieren comprobación.

### Resultado de la corrección del 17/11

Los manifiestos y bloqueos de iwe_test incorporan Vite 8.3.3 y source-map-js 1.2.2 en ambos proyectos y vite-plugin-singlefile 2.3.4 en la web. Instalación reproducible, TypeScript, compilación y pruebas de navegador pasaron en una copia aislada. npm audit --omit=dev informó cero avisos en ambos árboles. En la auditoría completa persiste GHSA-fc5q-39xc-vjpf en picomatch 4.0.7, con seis entradas altas en web y cinco en dashboard al contar sus dependientes. npm ofrece 4.0.7 como latest y el aviso de GitHub indica que falta un parche. El ejecutor local procesó la solicitud y bloqueó la activación. El automático quedó apagado. Reprobar al publicarse una corrección compatible.

### Instalación local actualizada y verificada

Se actualizaron los paquetes pendientes de web y dashboard en una copia aislada, manteniendo los tipos de Node del dashboard en la rama 22. Pasaron instalación estricta, TypeScript, compilación, navegador y auditoría de dependencias de ejecución. La auditoría completa mantiene GHSA-fc5q-39xc-vjpf en el árbol de compilación. Se actualizó la base local por única vez con copia de reversión y se verificaron los servidores web y dashboard, la API de menú y la vista compilada. El control de seguridad del ejecutor sigue vigente. La activación local no constituye un despliegue de producción.
