# Spec 02 - Rival por turnos

## 1. Objetivo

Incorporar un rival controlado por la computadora que participe en un combate por turnos contra Charizard, permitiendo atacar, recibir daño, alternar turnos y detectar la victoria o la derrota de cualquiera de los participantes.

## 2. Alcance

### Incluye

- Añadir un rival con vida propia (`hp`/`maxHp`), representado con los sprites existentes de Charizard y diferenciado por orientación y posición.
- Implementar un controlador de combate por turnos: el jugador inicia el combate con `B` y ataca con `J`; el rival responde automáticamente tras cada ataque válido.
- Aplicar 10 HP de daño por ataque, a ambos participantes, con aplicación única por animación.
- Reproducir las animaciones `attack` y `hurt` una sola vez, volviendo a `idle` al terminar, usando exclusivamente los datos existentes de `spritesheet.js`.
- Bloquear movimiento, `H` y `E` durante el combate activo, manteniendo `H` disponible durante la exploración.
- Mostrar dos barras de vida (jugador arriba-izquierda, rival arriba-derecha) y un banner persistente de resultado.
- Conservar el HP del rival entre escenarios.
- Mantener las reglas de derrota del Spec 01.

### No incluye

- Menú avanzado de cuatro ataques, puntos de poder (PP) ni selección de ataques.
- Experiencia, niveles, inventario, guardado de partidas, huida del combate ni ítems de curación.
- Recuperación automática de HP tras el combate.

### Dependencias

- **Depende del Spec 01** (`specs/01-barra-de-vida.md`, ya implementado). El Spec 02 **no puede romper** los criterios de aceptación del Spec 01: `hp`/`maxHp` en `Player`, derrota derivada de `hp === 0` (sin `fainted`), HUD `HP: XX/100`, `H` operativo en exploración, bloqueo de movimiento a 0 HP, `E` operativo a 0 HP, escala 3 y animaciones intactas.

## 3. Modelo de datos

### Rival (`js/rival.js`)

| Nombre | Tipo | Valor inicial | Restricciones o reglas de validación |
|---|---|---|---|
| `rival.hp` | `number` | `100` | Debe mantenerse entre `0` y `maxHp` (inclusive). Nunca negativo. Se clampa con `Math.max(0, rival.hp - 10)`. |
| `rival.maxHp` | `number` | `100` | Valor fijo de 100. No se cura. |
| `rival.px` | `number` | posición fija (≈72% del ancho del canvas) | No se desplaza. |
| `rival.py` | `number` | posición fija (≈55% de la altura del canvas) | No se desplaza. |
| `rival.dir` | `string` | `'left'` | Mira hacia el jugador. |
| `rival.anim` | `string` | `'idle'` | `'idle'`, `'attack'` o `'hurt'`. Usa las animaciones existentes. |
| `rival.elapsedMs` | `number` | `0` | Avanza con `dt`. En `attack`/`hurt` se usa `frameIndexAt(anim, elapsedMs, loop=false)`. |

**Estado de derrota:** El rival se considera derrotado cuando `rival.hp === 0`. Este estado **no se almacena** como booleano independiente (`fainted`), sino que se calcula de forma derivada a partir de `rival.hp`.

**Persistencia:** El rival se instancia **una única vez** en `start()`, junto al `Player`, y se conserva al cambiar de escenario. Por eso su `hp` persiste automáticamente entre el bosque y el volcán, sin estructuras adicionales.

### Controlador de combate (`js/battle.js`)

| Nombre | Tipo | Valor inicial | Restricciones o reglas de validación |
|---|---|---|---|
| `battle.state` | `string` | `'idle'` | `'idle'` (explorando), `'active'` (combate en curso), `'finished'` (finalizado). |
| `battle.phase` | `string`/`null` | `null` | En `active`: `'playerTurn'`, `'playerAttacking'`, `'rivalTurn'`, `'rivalAttacking'`. `'ended'` es terminal desde el Paso 6. |
| `battle.timer` | `number` | `0` | Milisegundos para temporizar la animación y la pausa entre turnos. |
| `battle.damageApplied` | `boolean` | `false` | Garantiza que el daño se aplique una sola vez por ataque. |
| `battle.result` | `string`/`null` | `null` | `'win'` o `'lose'`. Alimenta el banner persistente. |

**Constantes:** `ATAQUE_DANO = 10`, `PAUSA_TURNO_MS = 300`, teclas `KeyB` (iniciar) y `KeyJ` (atacar).

### Jugador (`js/player.js`, mínimo)

| Nombre | Tipo | Valor inicial | Restricciones o reglas de validación |
|---|---|---|---|
| `player.controlLocked` | `boolean` | `false` | Cuando es `true`, `Player.update` **no** reasigna `anim` ni aplica desplazamiento; solo avanza `elapsedMs`. Debe volver a `false` **al finalizar el combate, con victoria o derrota**. El desplazamiento posterior queda regido por el Spec 01: con `hp > 0` puede desplazarse; con `hp === 0` permanece inmóvil en `idle`. |

### Relación con los componentes existentes

- El `Player` ya existe y se crea una única vez en `start()`; el Spec 02 solo añade `player.controlLocked` para que la lógica de combate controle su animación sin que `Player.update` la sobrescriba.
- El rival se modela como una entidad nueva análoga a `Player` (mismos datos de vida y animación), reutilizando los sprites y helpers existentes.
- El controlador de combate es el único que ordena las transiciones de animación y aplica el daño; ni `Player` ni `Rival` deciden los turnos.

### Ciclo de animaciones `attack`/`hurt` (una sola reproducción)

Reglas comunes (jugador y rival), usando exclusivamente los datos existentes de `spritesheet.js`:

- Toda animación de una sola reproducción se inicia **una única vez** mediante un helper `playOnce(anim)`: fija `anim` y reinicia `elapsedMs = 0` **solo en la transición** (cuando cambia el `anim`). Mientras transcurre, en cada frame **solo** se hace `elapsedMs += dt`.
- Se considera terminada cuando `elapsedMs >= CHARIZARD[anim].totalMs`, usando `frameIndexAt(anim, elapsedMs, loop=false)` para el frame (se congela en el último frame al superar `totalMs`).
- **No** se reinicia `elapsedMs` ni se reasigna `anim` en cada frame (evita reinicios continuos de la animación).
- Al terminar, el participante vuelve a `idle`, **excepto** cuando una transición específica del combate exija otra animación inmediata (p. ej. encadenar `hurt` justo tras el impacto recibido).

Datos reales utilizados de `spritesheet.js`:

| Animación | `durationsMs` | `totalMs` | `events` |
|---|---|---|---|
| `attack` | `[33.3 ×7, 16.7 ×3, 33.3 ×5]` | `450.0` | `{ rush: 2, hit: 8, return: 11 }` |
| `hurt` | `[33.3, 133.3]` | `166.7` | sin `events` (no tiene frame de impacto; 2 frames) |
| `idle` | según `spritesheet.js` | según `spritesheet.js` | se reproduce en bucle (`loop=true`) como reposo |

### Cálculo del instante de impacto

- `events.hit` es un **índice de frame**, **no** milisegundos (confirmado en `spritesheet.js:108` y en `tools/gen_spritesheet.py:76`, que copia `HitFrame` del XML).
- El instante de impacto = **suma de `durationsMs` de los frames anteriores al índice `hit`**. Para `attack` (`hit: 8`): `33.3 × 7 + 16.7 ≈ 249.8 ms`.
- El valor se calcula siempre a partir de `CHARIZARD.attack.durationsMs` y `CHARIZARD.attack.events.hit`; no se codifican milisegundos a mano.

## 4. Decisiones técnicas aprobadas y sus justificaciones

| Decisión técnica | Justificación |
|---|---|
| **Reutilizar los sprites existentes de Charizard para el rival.** | No existen assets de rival en el proyecto. Reutilizarlos evita arte nuevo y dependencias, y respeta el uso de `getFrame`/`frameIndexAt`/`frame.shadow`. El rival se diferencia por orientación (`left`) y posición. |
| **Crear `js/rival.js` y `js/battle.js` durante los pasos correspondientes.** | Separar la entidad (estado y render) de la lógica de turnos mantiene `main.js` como orquestador y facilita commits independientes y pruebas aisladas. |
| **`B` inicia el combate y `J` ejecuta el ataque del jugador.** | Teclas explícitas que no colisionan con el movimiento (WASD/flechas), con `E` (cambio de escenario) ni con `H` (daño de prueba del Spec 01). |
| **El jugador actúa primero; ambos causan 10 HP de daño.** | Turnos simples, sin estadísticas adicionales. El valor de 10 es coherente con el daño ya usado en el Spec 01. |
| **Respuesta automática del rival con una pausa de ~300 ms.** | Hace legible el impacto y garantiza que el rival solo actúe tras un ataque válido del jugador, nunca mientras este decide. |
| **Aplicar daño una sola vez por ataque (`battle.damageApplied`).** | Evita múltiples impactos durante una misma animación, ya que el frame de golpe puede evaluarse en varios frames del bucle. |
| **Ciclo `attack`/`hurt` de una sola reproducción con retorno a `idle`.** | Usa `totalMs` y `frameIndexAt(..., loop=false)` con los datos existentes. El helper `playOnce(anim)` reinicia `elapsedMs` solo en la transición, evitando reinicios continuos por frame. Al terminar, cada combatiente vuelve a `idle`, salvo transición específica del combate. |
| **`player.controlLocked` vuelve a `false` al terminar el combate, con victoria o derrota.** | Restaura la lógica normal de `Player` y evita que la animación quede bloqueada. El desplazamiento posterior queda sujeto al Spec 01 según el HP (`hp > 0` ⇒ se mueve; `hp === 0` ⇒ inmóvil en `idle`). |
| **Bloquear movimiento, `H` y `E` durante el combate activo; mantener `H` disponible en exploración.** | Cumple las precisiones aprobadas y permite re-verificar los criterios del Spec 01 fuera del combate. |
| **Mostrar dos barras de vida y un banner persistente de victoria o derrota.** | El HUD existente se generaliza a `drawHealthBar(x, y, combatiente, alinearDerecha)`; el banner se dibuja con el `ctx` ya existente, sin añadir DOM. |
| **Conservar el HP del rival entre escenarios.** | Se resuelve desde la creación: el rival se instancia **una sola vez** en `start()` y el bloque de transición de escenario no lo reasigna. No requiere paso adicional. |
| **No recuperar HP automáticamente.** | Fuera del alcance aprobado y coherente con el Spec 01. |
| **Mantener las reglas de derrota del Spec 01.** | `hp === 0` ⇒ sin desplazamiento, animación `idle`, `E` operativo. No se introduce `fainted`. |
| **No permitir nuevos ataques ni turnos cuando alguno llegue a cero HP.** | `J` exige `phase === 'playerTurn'`; desde el Paso 6 se entra en `phase = 'ended'` y no se programa el siguiente turno. |
| **Conservar la escala 3 y las animaciones existentes; no modificar `spritesheet.js`.** | Es una regla dura del proyecto y garantiza continuidad visual. |

## 5. Plan de implementación

**Cada paso produce cambios concretos, permite realizar un commit por paso y deja el juego ejecutándose después de cada uno. No se agrupan todos los cambios en un único paso.**

### Paso 1: Cargar las animaciones de combate
- **Objetivo:** Disponer de las imágenes `attack` y `hurt` de Charizard sin alterar las ya existentes.
- **Archivos afectados:** `js/assets.js`
- **Cambios necesarios:** Cargar `Attack-Anim.png` y `Hurt-Anim.png` y exponerlas como `images.charizard.attack` e `images.charizard.hurt`, además de las ya existentes `idle`/`walk`.
- **Prueba verificable:** Iniciar el juego sin errores de carga. Comprobar que `idle`/`walk`, el movimiento, `E` y el HUD siguen funcionando igual que antes del cambio.
- **Resultado esperado:** Nuevas animaciones cargadas sin afectar a las existentes.

### Paso 2: Crear el rival con HP propio y representación visual
- **Objetivo:** Incorporar una instancia de rival con vida propia y visualización fija.
- **Archivos afectados:** `js/rival.js` (nuevo), `js/main.js`
- **Cambios necesarios:** Crear la clase `Rival` con `hp`/`maxHp` (100/100), `px`/`py` fijos, `dir = 'left'`, `anim = 'idle'`, `elapsedMs`, y un método `draw` que use `getFrame`, `frameIndexAt` y `frame.shadow` con `ESCALA`. Incluir el helper `playOnce` y el retorno a `idle`. Crear la **instancia única** del rival en `start()` (junto al `Player`) y dibujarla en `render()` tras el jugador. NO reasignar la instancia en el cambio de escenario.
- **Prueba verificable:** El rival se visualiza en su posición fija mirando a la izquierda, con HP 100 propio y animación `idle` en bucle. El movimiento del jugador, las animaciones y `E` siguen sin alterarse.
- **Resultado esperado:** Rival visible y persistente (misma instancia entre escenarios), sin afectar a lo existente.

### Paso 3: Implementar el HUD dual
- **Objetivo:** Mostrar dos barras de vida, una por combatiente.
- **Archivos afectados:** `js/main.js`
- **Cambios necesarios:** Generalizar `drawHUD` a `drawHealthBar(x, y, combatiente, alinearDerecha)`. Dibujar la barra del jugador arriba-izquierda y la del rival arriba-derecha, leyendo `hp`/`maxHp` de cada combatiente.
- **Prueba verificable:** Se muestran dos barras proporcionales, cada una con `HP: 100/100`, en sus esquinas correspondientes.
- **Resultado esperado:** HUD dual correcto sin interrumpir el render ni la exploración.

### Paso 4: Crear el controlador de combate e iniciar con B
- **Objetivo:** Introducir el estado de combate y permitir iniciarlo con `B`, bloqueando los controles durante el combate activo.
- **Archivos afectados:** `js/battle.js` (nuevo), `js/main.js`
- **Cambios necesarios:** Crear el controlador con `state`/`phase`/`timer`/`damageApplied`/`result`. `B` inicia el combate solo si `state === 'idle'` y ambos `hp > 0`. Con `state === 'active'`, bloquear movimiento, `E`, `H` y `B`. Ejecutar `clearKeys()` al iniciar para evitar desplazamientos residuales.
- **Prueba verificable:** Pulsar `B` → comienza el combate. Durante el combate, el movimiento, `E`, `H` y `B` quedan bloqueados. (La restauración de controles se verifica en el Paso 7.)
- **Resultado esperado:** Combate iniciado con los controles de exploración bloqueados.

### Paso 5: Implementar el ataque del jugador mediante J
- **Objetivo:** Permitir que el jugador ataque y dañe al rival en su turno.
- **Archivos afectados:** `js/battle.js`, `js/main.js`, `js/player.js`
- **Cambios necesarios:** `J` es válida solo si `state === 'active'`, `phase === 'playerTurn'` y ambos `hp > 0`; entonces `phase = 'playerAttacking'` y se ejecuta `playOnce('attack')` en el jugador (`loop=false`). Al iniciar el combate, `player.controlLocked = true` para que `Player.update` no reasigne `anim` ni aplique desplazamiento. Aplicar 10 HP al rival **una sola vez** en el instante de impacto (`∑ durationsMs` previos a `events.hit`), usando `damageApplied`. Al terminar `attack`, el jugador vuelve a `idle` si no hay transición inmediata.
- **Prueba verificable:** Pulsar `J` reproduce `attack` una vez, resta exactamente 10 HP al rival y actualiza su HUD; después vuelve a `idle`. Pulsar `J` durante el ataque no produce efecto. No hay doble impacto ni reinicio de la animación.
- **Resultado esperado:** Ataque del jugador funcional y daño único al rival.

### Paso 6: Implementar la respuesta automática del rival
- **Objetivo:** Que el rival responda automáticamente tras el ataque válido del jugador.
- **Archivos afectados:** `js/battle.js`
- **Cambios necesarios:** Al terminar el ataque del jugador, si `rival.hp > 0`, pasar a `phase = 'rivalTurn'` (pausa ~300 ms) y luego `playOnce('attack')` en el rival; aplicar 10 HP al jugador **una sola vez** en su `events.hit`. El jugador reproduce `playOnce('hurt')` (sin `events`, una sola vez) y luego vuelve a `idle`. Al terminar la secuencia, `phase = 'playerTurn'`. **Precisión P2:** si en cualquier momento un participante queda con `hp === 0`, entrar en `phase = 'ended'` y no programar nuevos turnos ni aceptar más `J` (aunque `state` siga `'active'` hasta el Paso 7).
- **Prueba verificable:** El rival responde exactamente una vez por ataque válido, con la pausa y solo después de un ataque del jugador. `attack` y `hurt` se reproducen una vez y vuelven a `idle`. Al llegar uno a 0 HP, se detienen los turnos y no se admiten más ataques.
- **Resultado esperado:** Alternancia de turnos completa con animaciones de una sola reproducción.

### Paso 7: Gestionar victoria, derrota y finalización
- **Objetivo:** Resolver el final del combate y restaurar la exploración.
- **Archivos afectados:** `js/battle.js`, `js/main.js`
- **Cambios necesarios:** Al detectar `phase = 'ended'`, pasar a `state = 'finished'`, mostrar el **banner persistente** (`¡Victoria!` o `¡Derrota!`), garantizar que `J` y `B` queden bloqueados, poner **`player.controlLocked = false`** y restaurar la exploración según el Spec 01: con `hp > 0` se recupera el movimiento; con `hp === 0`, el jugador permanece inmóvil en `idle` con `E` operativo. El derrotado queda en `idle`; el superviviente vuelve a `idle`. Sin reinicio de HP.
- **Prueba verificable:** Llevar al rival a 0 → banner “¡Victoria!”, `J`/`B` bloqueados, movimiento/`E`/`H` restaurados y `controlLocked === false`. Llevar al jugador a 0 → banner “¡Derrota!”, Charizard inmóvil en `idle`, `E` operativo, `H` sin efecto y `controlLocked === false`.
- **Resultado esperado:** Final del combate consistente, con banner persistente y exploración restaurada.

## 6. Criterios de aceptación

| Nº | Criterio verificable (sí/no) |
|---|---|
| 1 | ¿`B` inicia el combate solo si `state === 'idle'` y ambos participantes tienen `hp > 0`? (Sí/No) |
| 2 | ¿Durante `state === 'active'` están bloqueados el movimiento, `E`, `H` y `B`? (Sí/No) |
| 3 | ¿Pulsar `J` en `playerTurn` reproduce `attack` una vez y resta exactamente 10 HP al rival, sin doble impacto? (Sí/No) |
| 4 | ¿El rival responde con exactamente un ataque tras cada ataque válido del jugador, nunca mientras el jugador decide? (Sí/No) |
| 5 | ¿`attack` y `hurt` se reproducen una sola vez con `totalMs`/`frameIndexAt(..., loop=false)`, sin reiniciarse por frame, y vuelven a `idle`? (Sí/No) |
| 6 | ¿Al llegar cualquiera a 0 HP se bloquean `J` y `B` y aparece un banner persistente con el resultado? (Sí/No) |
| 7 | ¿Al terminar el combate (victoria o derrota) `player.controlLocked` vuelve a `false`, y el desplazamiento queda regido por el Spec 01 según el HP? (Sí/No) |
| 8 | ¿La barra de vida del rival se muestra arriba-derecha y refleja su HP inmediatamente? (Sí/No) |
| 9 | ¿`H` funciona en exploración y solo se deshabilita durante el combate activo? (Sí/No) |
| 10 | ¿Se conservan la escala 3, las animaciones y las funcionalidades del Spec 01? (Sí/No) |

## 7. Decisiones descartadas

### Alternativa descartada: Crear un estado global o "party" para la vida de ambos combatientes

- **Alternativa:** Almacenar `hp`/`maxHp` de jugador y rival en un estado global (p. ej. `gameState.party`), con un paso separado para sincronizar la persistencia del rival entre escenarios.
- **Motivo del descarte:** La arquitectura actual crea cada instancia una única vez y la conserva entre escenarios; el `Player` ya guarda su vida (Spec 01). Duplicar la fuente de verdad añadiría complejidad de sincronización sin ningún beneficio.
- **Decisión adoptada:** El rival vive en su propia instancia (`js/rival.js`) y su HP persiste por construcción, sin un paso adicional ni estado global.

### Alternativa descartada: Aplicar el daño con un temporizador fijo en lugar del evento `hit`

- **Alternativa:** Aplicar el daño tras un tiempo fijo arbitrario, en lugar de usar `events.hit`.
- **Motivo del descarte:** `events.hit` es el índice de frame real de impacto; convertido a milisegundos mediante `durationsMs`, alinea el daño con la animación y evita desincronizaciones.
- **Decisión adoptada:** Aplicar el daño en el instante derivado de `events.hit` y `durationsMs`.

### Alternativa descartada: Reiniciar la animación en cada actualización

- **Alternativa:** Resetear `elapsedMs` y reasignar `anim` en cada frame.
- **Motivo del descarte:** Provocaría reinicios continuos de la animación y esta nunca avanzaría, impidiendo reproducir `attack`/`hurt` correctamente.
- **Decisión adoptada:** `playOnce(anim)` reinicia `elapsedMs` solo en la transición; durante la animación solo se acumula `dt`; al superar `totalMs` se vuelve a `idle`.

## 8. Procedimiento de verificación

1. **Verificación paso a paso:** Ejecutar el juego tras cada paso y confirmar su prueba. El juego debe quedar ejecutable y el commit debe ser independiente en cada paso.
2. **Combate completo:** Pulsar `B` e intercambiar ataques con `J`. Verificar daño único, respuesta única del rival, actualización inmediata de ambas barras y que `attack`/`hurt` se reproducen una sola vez y vuelven a `idle`.
3. **Finalización:** Llevar al rival a 0 → banner “¡Victoria!” y exploración restaurada (movimiento/`E`/`H`) si el jugador tiene `hp > 0`. Llevar al jugador a 0 → banner “¡Derrota!”, Charizard inmóvil en `idle`, `E` operativo y `H` sin efecto. En ambos casos, confirmar que `player.controlLocked === false`.
4. **Prueba viable de persistencia parcial del rival (derrota del jugador):**
   1. En exploración, pulsar `H` **7 veces** → jugador `30/100`.
   2. Pulsar `B` → inicia el combate.
   3. Intercambios (jugador primero, 10 de daño): `J` → rival 90 / jugador 20; `J` → rival 80 / jugador 10; `J` → rival 70 / jugador 0 → **derrota**.
   4. Pulsar `E` → cambiar bosque↔volcán (permitido: `state = 'finished'` y, según el Spec 01, `E` opera a 0 HP).
   5. Verificar que el rival **conserva `HP: 70/100`** (no se reinicia).
   - **Límites conocidos:** Solo son alcanzables valores de la forma `100 − HP_inicial_jugador` (múltiplos de 10). Desde 100/100 contra 100/100 el jugador gana siempre (primer turno y daño igual), por lo que la prueba de valor parcial exige reducir primero al jugador con `H`. No existe huida ni salida parcial (regla aprobada), así que el rival parcial no se observa durante un combate activo; el resto de casos queda garantizado por la instancia única del rival.
5. **Comprobación de los criterios del Spec 01 (regresión):**
   - `H` en exploración resta 10 por pulsación e ignora `event.repeat`; `hp` nunca es negativo (clamp a 0).
   - A `hp === 0`: sin desplazamiento, animación `idle`, barra `HP: 0/100` y `E` cambia de escenario.
   - Escala 3 y anclaje mediante `frame.shadow` intactos (sin “saltos”); animaciones y HUD sin regresiones.
6. **Aislamiento y restricciones del proyecto:** Confirmar que ningún paso del Spec 02 rompe los criterios de aceptación del Spec 01 y que no se ha modificado `spritesheet.js`. Confirmar que `H` permanece disponible en exploración y que la funcionalidad previa sigue operativa.
