---
name: crear-spec
description: Crea y revisa especificaciones SDD para funcionalidades del juego Pokémon. Se utiliza después de refinar un plan y antes de implementar código.
---

# Skill: Crear especificaciones SDD

## Propósito

Convertir las decisiones aprobadas durante la planificación en una especificación técnica verificable para el juego Pokémon.

Esta skill no implementa código.

## Instrucciones obligatorias

1. Leer primero README.md y respetar las reglas del proyecto.
2. Analizar únicamente los archivos necesarios.
3. Recuperar las decisiones aprobadas durante la planificación.
4. No inventar decisiones que el usuario no haya aprobado.
5. Si faltan decisiones importantes, solicitar aclaraciones antes de crear el spec.
6. Crear el archivo en specs/ con el nombre proporcionado por el usuario.
7. Utilizar español claro y terminología técnica precisa.
8. No implementar código ni instalar dependencias.
9. No modificar archivos ajenos a la especificación.
10. No realizar commits automáticamente.

## Estructura obligatoria del spec

# Spec NN - Nombre de la funcionalidad

## 1. Objetivo

Describir en una sola frase qué problema resuelve la funcionalidad.

## 2. Alcance

### Incluye
Enumerar los comportamientos que formarán parte de la funcionalidad.

### No incluye
Indicar al menos dos elementos que quedan explícitamente fuera del alcance.

### Dependencias
Identificar dependencias de otros specs, cuando existan.

## 3. Modelo de datos

Definir los datos necesarios con nombres concretos.

Para cada dato, indicar:
- Nombre
- Tipo
- Valor inicial, cuando corresponda
- Restricciones o reglas de validación

Explicar cómo se relacionan los datos con los componentes existentes.

## 4. Decisiones técnicas

Registrar las decisiones aprobadas y sus motivos.

## 5. Plan de implementación

Crear pasos numerados.

Para cada paso especificar:
- Objetivo del paso
- Archivos que se crearán o modificarán
- Cambios necesarios
- Forma de verificar el resultado

Cada paso debe dejar el juego funcionando.

No agrupar toda la funcionalidad en un único paso.

## 6. Criterios de aceptación

Definir al menos tres criterios que puedan verificarse con sí o no.

Cada criterio debe indicar una prueba observable.

Evitar expresiones ambiguas como:
- Funciona correctamente
- Es intuitivo
- Es rápido
- Tiene buen diseño

## 7. Decisiones descartadas

Documentar al menos una alternativa que se haya evaluado y descartado.

Indicar:
- Alternativa
- Motivo del descarte
- Decisión adoptada

## 8. Verificación

Indicar cómo se comprobará que la funcionalidad cumple sus criterios de aceptación.

## Reglas del flujo SDD

- Primero se refina el plan.
- Después se crea y revisa el spec.
- El spec debe tener su propio commit antes del código.
- Durante Build se implementa un único paso por solicitud.
- Cada paso implementado debe verificarse antes de su commit.
- Si cambia una decisión, actualizar primero el spec y registrar ese cambio.
- No comenzar la segunda funcionalidad hasta cerrar la primera.

## Restricciones del proyecto

- No modificar spritesheet.js.
- Utilizar getFrame(), frameIndexAt() y los datos existentes cuando corresponda.
- Mantener el anclaje mediante frame.shadow.
- Conservar las funcionalidades previamente implementadas.
- No agregar dependencias sin autorización.
- No realizar cambios fuera del alcance aprobado.

## Resultado esperado

Generar un archivo Markdown completo y listo para revisión.

Después de generarlo, detenerse y esperar autorización del usuario antes de realizar cualquier otra acción.
