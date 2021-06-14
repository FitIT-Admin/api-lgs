# API nielsen

Es una aplicación generada con [LoopBack 4 CLI](https://loopback.io/doc/en/lb4/Command-line-interface.html) con la base inicial
(https://loopback.io/doc/en/lb4/Loopback-application-layout.html).

## Instalar dependencias
```sh
npm install
```

## Actualizar dependencias
```sh
npm install
```

## Configuracion

La aplicación lee la configuración del archivo .env (Se debe crear manual en el servidor, o se pueden versiones los .env por ambiente, utilizando 3 pipelines para instalar cada uno en la maquina correspondiente)

MONGODB_URI=mongodb://nielsen:123123@localhost:27017/nielsen
FRONTEND_URL=http://localhost:4200
SENDGRID_API_KEY=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
SENDGRID_SENDER_FROM=contacto@fitit.cl

## Correr aplicación

```sh
npm start
```

## Verificación

Abre http://127.0.0.1:3000 en tu navegador.

## Reconstruir Aplicación

```sh
npm run build
```

## Limpiar Aplicación

```sh
npm run rebuild
```
