# Proyecto para la asignatura de Desarrollo de aplicaciones en la nube

## Pasos para ejecutar la aplicación

### Desplazarnos a la ruta del proyecto node
```
//Desde la ruta del proyecto en la consola
cd ./urbanspot
```

### Instalar dependencias

```
npm i
```

### Ejecutar si vas a desplegarlo en IaaS

```
npx prisma generate
npm run dev

// estará disponible en http://localhost:3000
```

> [!IMPORTANT]  
> Todo lo subido a la rama main se autodespliega en https://urbanspot-lac.vercel.app/, antess de hacer un merge, ejecutar:

```
npm run build

```
Esto nos permitirá sacar errores de compilación al buildear (errores que darán al desplegar), si no da errores adelante con el merge.
