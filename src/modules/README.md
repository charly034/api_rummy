# Modulos

Cada modulo nuevo puede usar esta estructura para mantener separacion de responsabilidades:

nombreModulo/
nombreModulo.routes.js
nombreModulo.controller.js
nombreModulo.service.js
nombreModulo.repository.js
nombreModulo.validator.js

- routes: define endpoints y delega en controller.
- controller: maneja request/response y llama al service.
- service: contiene la logica de negocio.
- repository: acceso a base de datos cuando se agregue.
- validator: validaciones de entrada cuando se agreguen.
