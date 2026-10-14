# Spec 01 - Barra de vida de Charizard

## 1. Objetivo

Representar la vida de Charizard, reducirla cuando recibe daño mediante la tecla H y reconocer cuándo ha sido derrotado.

## 2. Alcance

### Incluye

- Añadir `hp` y `maxHp` directamente a la instancia `Player`, con valor inicial y máximo de 100.
- Dibujar en canvas un HUD fijo con barra de vida proporcional y texto `HP: XX/100` en la esquina superior izquierda.
- Aplicar daño de 10 HP por cada pulsación válida de la tecla `H`, ignorando las repeticiones automáticas de `event.repeat`.
- Bloquear el desplazamiento de Charizard cuando su vida llegue a 0, utilizando la animación idle existente y manteniendo su escala 3.
- Conservar la vida actual (`hp`) al cambiar entre los escenarios del bosque y el volcán.
- Permitir que el juego siga renderizando y cambiando entre escenarios cuando Charizard esté derrotado.

### No incluye

- Rivales controlados por computadora, combate por turnos, experiencia, niveles ni menú de ataques avanzado.
- Recuperación de vida, ítems de curación o cualquier sistema de curación.

### Dependencias

Ninguna. Se trata de la primera especificación funcional del proyecto.

## 3. Modelo de datos

| Nombre | Tipo | Valor inicial | Restricciones o reglas de validación |
|---|---|---|---|
| `player.maxHp` | `number` | `100` | Valor fijo de 100. No se modificará con esta funcionalidad. |
| `player.hp` | `number` | `100` | Debe mantenerse entre `0` y `maxHp` (inclusive). Nunca podrá ser negativo. Se clampa a 0 con `Math.max(0, hp - cantidad)`. |

**Estado de derrota:** Se considera derrotado cuando `player.hp === 0`. Este estado **no se almacena** como un booleano independiente (`fainted`), sino que se calcula de forma derivada en todo momento a partir de `player.hp`. Esto evita duplicidad e inconsistencias entre estados.

**Persistencia:** `hp` y `maxHp` viven en la instancia `Player`, que se crea una única vez al iniciar el juego y se conserva al cambiar de escenario. Por eso la vida se conserva automáticamente al pasar del bosque al volcán, sin necesidad de estructuras adicionales.

## 4. Decisiones técnicas aprobadas y sus justificaciones

| Decisión técnica | Justificación |
|---|---|
| **Almacenar `hp` y `maxHp` directamente en la instancia `Player`.** | La arquitectura real del proyecto crea la instancia `Player` una única vez al iniciar el juego y la conserva al cambiar entre escenarios (bosque y volcán). Esto permite que el estado de vida persista de forma natural, sin necesidad de estructuras externas. |
| **No almacenar `fainted` como booleano independiente.** | El estado derrotado es 100% derivado de `player.hp === 0`. No duplicar la fuente de verdad elimina riesgos de desincronización y simplifica la lógica. |
| **Manejar daño con evento `keydown` e ignorar `event.repeat`.** | Cumple exactamente la decisión de que mantener presionada la tecla `H` no provoque daño repetido automáticamente. No se añade ningún sistema nuevo de edge detection por frames, sino que se aprovecha el comportamiento nativo del evento existente. |
| **Aplicar -10 HP por pulsación válida, solo si `hp > 0`.** | Garantiza que no se aplique daño una vez derrotado y que `hp` nunca sea negativo. El valor se fija en 10 y se aplica con `player.hp = Math.max(0, player.hp - 10)`. |
| **Dibujar HUD en canvas: barra de vida proporcional + texto `HP: XX/100` en esquina superior izquierda.** | El proyecto dibuja toda la interfaz en canvas (no existe contenedor DOM para HUD). Posición fija superior izquierda, sencilla y no invasiva. La barra debe ser proporcional a `hp / maxHp` y, cuando `hp === 0`, debe quedar vacía mostrando `HP: 0/100`. Debe actualizarse inmediatamente ante cualquier cambio de `hp`. |
| **Al llegar a 0 HP, bloquear el desplazamiento, utilizar la animación idle existente, mantener escala 3 y no detener el render ni el cambio de escenarios.** | Se añade únicamente un gating condicional (`if (player.hp <= 0)`) en la lógica de movimiento de `Player`. No se modifica el sistema de animaciones ni la escala actual (3). En ese estado debe conservarse la animación idle existente (sin forzar una animación distinta). El bucle de renderizado debe seguir ejecutándose y el cambio entre escenarios debe seguir siendo posible. |
| **Conservar HP entre bosque y volcán.** | Al mantenerse la misma instancia de `Player` entre cambios de escenario, los valores `hp` y `maxHp` se conservan automáticamente, cumpliendo la persistencia solicitada. |
| **No crear un estado global adicional para HP.** | La persistencia ya queda garantizada por la instancia única de `Player`. Un estado global introduciría duplicidad de la fuente de verdad y complejidad de sincronización sin aportar beneficio. |
| **No modificar `spritesheet.js`, ni el sistema de animación ni funcionalidades existentes.** | Se preservan íntegramente el movimiento, las animaciones, la escala y el cambio de escenarios. Los cambios se limitan a añadir campos a `Player` y a añadir lógica mínima de input y render de HUD en `main.js`. |

## 5. Plan de implementación

**Cada paso produce cambios concretos, permite realizar un commit por paso y deja el juego ejecutándose después de cada uno. No se agrupan todos los cambios en un único paso.**

### Paso 1: Agregar hp y maxHp a Player
- **Objetivo:** Incorporar `hp` y `maxHp` a la instancia `Player`, inicializados en 100/100.
- **Archivos afectados:** `js/player.js`
- **Cambios necesarios:** Inicializar `this.maxHp = 100` y `this.hp = 100` en la creación de la instancia `Player` (en el constructor o punto de inicialización correspondiente).
- **Prueba verificable:** Iniciar el juego. Comprobar que la instancia `Player` contiene `hp === 100` y `maxHp === 100`. Verificar que el movimiento, las animaciones, la escala 3, el renderizado y el cambio entre escenarios siguen funcionando. El juego debe continuar ejecutándose correctamente.
- **Resultado esperado:** Campos añadidos sin alterar funcionalidades existentes.

### Paso 2: Dibujar el HUD con barra proporcional y texto HP: XX/100
- **Objetivo:** Mostrar el HUD con barra de vida proporcional y texto `HP: XX/100` en la esquina superior izquierda, actualizado inmediatamente.
- **Archivos afectados:** `js/main.js`
- **Cambios necesarios:** Añadir el dibujo del HUD en canvas **después** de renderizar el escenario y el jugador. Debe mostrarse en posición fija (esquina superior izquierda), con texto `HP: ${player.hp}/100` y una barra rectangular proporcional a `Math.max(0, player.hp) / player.maxHp`. Cuando `player.hp === 0`, la barra debe quedar vacía (ancho 0) y mostrar `HP: 0/100`. El HUD debe leerse directamente de `player.hp` y `player.maxHp`.
- **Prueba verificable:** Iniciar el juego. Verificar que se visualiza `HP: 100/100` y la barra aparece completa en la esquina superior izquierda. Cambiar entre bosque y volcán y comprobar que el HUD sigue visible y correcto. El juego debe continuar ejecutándose correctamente.
- **Resultado esperado:** HUD visible sin interrumpir el render, movimiento, animaciones ni cambio de escenarios.

### Paso 3: Implementar daño de 10 HP mediante H, ignorando event.repeat
- **Objetivo:** Aplicar -10 HP por pulsación válida de `H`, evitando repeticiones al mantenerla presionada.
- **Archivos afectados:** `js/main.js`
- **Cambios necesarios:** Gestionar el evento `keydown` para la tecla `H`. Condiciones obligatorias: si `event.repeat === true` → ignorar. Solo aplicar daño si `player.hp > 0` → `player.hp = Math.max(0, player.hp - 10)`. No aplicar daño cuando `player.hp <= 0`. El cambio de `hp` debe reflejarse inmediatamente en el HUD.
- **Prueba verificable:** Con `HP: 100/100`, pulsar H una vez → debe mostrar `HP: 90/100` y la barra reducirse proporcionalmente. Mantener H pulsada → únicamente debe producir una reducción de HP (se ignora `event.repeat`). Con `hp === 0`, pulsar H varias veces → `hp` debe permanecer 0. El juego debe continuar ejecutándose correctamente en todos los casos.
- **Resultado esperado:** Sistema de daño funcional, cumpliendo la restricción de no repetición, sin romper las funcionalidades existentes.

### Paso 4: Bloquear el desplazamiento al llegar a cero HP y utilizar la animación idle existente
- **Objetivo:** Cuando `hp === 0`, bloquear el desplazamiento, utilizando la animación idle existente, manteniendo la escala 3, y permitiendo que el juego siga renderizando y cambiando entre escenarios.
- **Archivos afectados:** `js/player.js`
- **Cambios necesarios:** En la lógica de movimiento (actualización de desplazamiento/velocidad) de `Player`, añadir un gating: **si `this.hp <= 0`, no aplicar ningún desplazamiento** y mantener la animación idle existente. No modificar el sistema de animaciones, no cambiar la escala actual (3) y no detener el bucle de renderizado ni la lógica de cambio de escenarios.
- **Prueba verificable:** Reducir `hp` hasta 0 (mediante pulsaciones válidas de H). Comprobar que Charizard **deja de desplazarse**, conserva la animación idle existente y mantiene su escala 3. Comprobar que el juego sigue renderizando y que es posible cambiar entre los escenarios del bosque y el volcán mientras está en estado derrotado. Partir de nuevo con `hp > 0` para verificar que el movimiento vuelve a funcionar. El juego debe continuar ejecutándose correctamente.
- **Resultado esperado:** Comportamiento de derrota consistente con lo especificado, sin alterar animaciones, escala, renderizado ni cambio de escenarios.

## 6. Criterios de aceptación

| Nº | Criterio verificable (sí/no) |
|---|---|
| 1 | ¿Al iniciar el juego, el HUD muestra `HP: 100/100` y la barra de vida aparece completa? (Sí/No) |
| 2 | ¿Al pulsar H una vez con HP 100, el HUD muestra `HP: 90/100` de forma inmediata y la barra refleja el cambio? (Sí/No) |
| 3 | ¿Al mantener presionada la tecla H, únicamente se produce una reducción de HP (se ignora `event.repeat`)? (Sí/No) |
| 4 | ¿Tras 10 pulsaciones válidas (de 100 a 0), el HUD muestra `HP: 0/100`, la barra queda vacía y Charizard no puede desplazarse, utilizando la animación idle existente y manteniendo su escala 3? (Sí/No) |
| 5 | ¿Con HP 0, al pulsar H nuevamente, el HP permanece en 0 (nunca se vuelve negativo)? (Sí/No) |
| 6 | ¿Al cambiar entre escenarios (bosque y volcán), la vida actual se conserva (ej. 60/100 sigue siendo 60/100)? (Sí/No) |
| 7 | ¿Cuando está derrotado (HP 0), el estado se mantiene al cambiar de escenario (sigue sin poder desplazarse), conserva la animación idle, mantiene escala 3 y el juego sigue renderizando y permitiendo el cambio de escenarios? (Sí/No) |
| 8 | ¿Se han conservado movimiento, animaciones, escala 3 y el cambio de escenarios sin alteraciones fuera del bloqueo por derrota? (Sí/No) |

## 7. Decisiones descartadas

### Alternativa descartada: Crear un estado global independiente para HP

- **Alternativa:** Definir un objeto global (p. ej. `gameState.pokemon`) fuera de `Player` para almacenar `hp`, `maxHp` (y eventualmente `fainted`).
- **Motivo del descarte:** La arquitectura actual del proyecto crea la instancia `Player` **una única vez** al iniciar el juego y la **conserva** al cambiar entre los escenarios del bosque y el volcán. Por ello, almacenar `hp` y `maxHp` directamente en esa instancia es suficiente para garantizar la persistencia entre escenas. Crear un estado global adicional introduciría duplicidad innecesaria, aumentaría la complejidad de sincronización y no aporta beneficio alguno frente a la solución más sencilla y alineada con la implementación existente.
- **Decisión adoptada:** Almacenar `hp` y `maxHp` directamente en `Player`, con estado de derrota derivado (`hp === 0`), sin crear un estado global independiente.

## 8. Procedimiento de verificación

1. **Ciclo de vida de Player:** Iniciar el juego y cambiar entre bosque y volcán varias veces. Verificar que la instancia `Player` no se recrea (se mantiene a lo largo de los cambios de escenario). El juego debe seguir ejecutándose y renderizando correctamente.
2. **Inicialización:** Arrancar el juego. Verificar HUD `HP: 100/100`, barra completa, Charizard puede moverse, animaciones y escala 3 correctas.
3. **Daño único:** Pulsar H una vez. Verificar `HP: 90/100`, barra reducida proporcionalmente, movimiento aún permitido.
4. **Prevención de repetición:** Mantener H pulsada durante ~2 segundos. Verificar que HP solo baja una única vez (se ignora `event.repeat`).
5. **Derrota progresiva:** Aplicar 10 pulsaciones válidas hasta llegar a 0. Verificar `HP: 0/100`, barra vacía, **no puede desplazarse**, utiliza **la animación idle existente** y mantiene **escala 3**. El juego debe seguir renderizando y debe permitir cambiar entre escenarios.
6. **Protección post-derrota:** Con HP 0, pulsar H múltiples veces. Verificar que HP permanece 0 y nunca es negativo.
7. **Persistencia entre escenarios:** Reducir HP a 60/100. Cambiar de bosque a volcán y volver a bosque. Verificar que HP es 60/100.
8. **Persistencia de estado derrotado:** Llevar HP a 0. Cambiar de escenario (bosque↔volcán). Verificar que sigue sin poder desplazarse, conserva la animación idle existente, mantiene escala 3, el HUD muestra `HP: 0/100` y el juego sigue renderizando y permitiendo el cambio de escenarios.
9. **Pruebas de regresión:** Durante todas las pruebas anteriores, verificar que movimiento, animaciones, escala 3 y cambio de escenarios funcionan correctamente. No se observan cambios fuera del gating por derrota. Confirmar que no se ha modificado `spritesheet.js`.
