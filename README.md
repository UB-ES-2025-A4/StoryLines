# StoryLines


## Cómo ejecutar el proyecto en local

> **Todos los comandos deben ejecutarse desde la raíz del proyecto (C:\ ... \StoryLines) .**

### 1️. Instalar todas las dependencias:
```bash
npm install
npm run install-all
```
### 2. Generar el build del frontend:

```bash
npm run build-frontend
```
### 3. Iniciar la aplicación:
```bash
npm start
```
## Linting (análisis estático del código)

Este proyecto utiliza ESLint (Flat Config) tanto en frontend como en backend.


## Linting del proyecto (Frontend + Backend)

A continuación se detallan exactamente los pasos realizados para limpiar el código del proyecto.

### Instalar todas las dependencias (solo si es necesario)
```bash
npm install
npm run install-all
```
### Ejecutar en Frontend (Vue) y Backend
Para ver errores:
```bash
npm run lint
```
Para arregalr automáticamente y ver errores restantes:
```bash
npm run lint -- --fix
```
Y los errores que no se han podido solucionar arreglarlos manualmente.

Ahora lo implementaremos automáticamente también con Github Actions.
