# Manual de despliegue en VPS

Guía para publicar la API y el frontend de Rummys en un servidor Ubuntu 22.04 LTS con Nginx, PM2 y SSL.

**Arquitectura resultante:**
```
Internet → Nginx (80/443)
              ├── /         → archivos estáticos del frontend (dist/)
              └── /api/     → proxy → Node.js (puerto 3000, manejado por PM2)
```

---

## 1. Preparar el servidor

Conectarse al VPS por SSH y crear un usuario no-root:

```bash
ssh root@IP_DEL_VPS

adduser rummys
usermod -aG sudo rummys
# Copiá tu clave SSH al nuevo usuario (opcional pero recomendado)
rsync --archive --chown=rummys:rummys ~/.ssh /home/rummys

ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# A partir de acá trabajar como rummys
su - rummys
```

---

## 2. Instalar Node.js (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

nvm install 20
nvm use 20
nvm alias default 20
node -v   # debe mostrar v20.x.x
```

---

## 3. Instalar PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Crear base de datos y usuario

```bash
sudo -u postgres psql
```

Dentro de psql:

```sql
CREATE USER rummys_user WITH PASSWORD 'contraseña_segura_aqui';
CREATE DATABASE rummys OWNER rummys_user;
GRANT ALL PRIVILEGES ON DATABASE rummys TO rummys_user;
\q
```

Verificar conexión:

```bash
psql -U rummys_user -d rummys -h localhost
# Si conecta, todo OK. Salir con \q
```

---

## 4. Subir los archivos al VPS

### Opción A — desde tu máquina local (recomendada)

```bash
# En tu PC local, desde la carpeta que contiene api_rummy/ y front/
rsync -avz --exclude='node_modules' --exclude='.env' --exclude='dist' \
  ./api_rummy/ rummys@IP_DEL_VPS:/home/rummys/api/

rsync -avz --exclude='node_modules' --exclude='dist' \
  ./front/ rummys@IP_DEL_VPS:/home/rummys/front/
```

### Opción B — desde un repositorio Git

```bash
# En el VPS
git clone https://github.com/tu-usuario/rummys.git /home/rummys/app
```

---

## 5. Configurar y migrar la API

```bash
cd ~/api

npm install --production

# Crear archivo de entorno
cp .env.example .env
nano .env
```

Valores clave para producción:

```env
PORT=3000
NODE_ENV=production
API_NAME=Rummys
CORS_ORIGIN=https://tudominio.com

DATABASE_URL=postgresql://rummys_user:contraseña_segura_aqui@localhost:5432/rummys

DB_SSL=false
PGSSLMODE=disable
```

Guardar y aplicar migraciones:

```bash
npm run migrate
# Debe imprimir: "OK: 001_create_jugadores.sql" y "OK: 002_create_partidas.sql"
```

---

## 6. Instalar PM2 y lanzar la API

```bash
npm install -g pm2

cd ~/api
pm2 start src/server.js --name rummys-api

# Guardar configuración para que arranque al reiniciar el VPS
pm2 save
pm2 startup
# Copiar y ejecutar el comando que imprime pm2 startup
```

Comandos útiles de PM2:

```bash
pm2 status               # ver estado
pm2 logs rummys-api      # ver logs en tiempo real
pm2 restart rummys-api   # reiniciar
pm2 stop rummys-api      # detener
```

---

## 7. Construir el frontend

```bash
cd ~/front
npm install
npm run build
# Los archivos quedan en ~/front/dist/
```

---

## 8. Instalar y configurar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

Crear la configuración del sitio:

```bash
sudo nano /etc/nginx/sites-available/rummys
```

Pegar el siguiente contenido (reemplazá `tudominio.com`):

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend — archivos estáticos
    root /home/rummys/front/dist;
    index index.html;

    # SPA: redirigir rutas al index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API — proxy inverso al servidor Node
    location /api/ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Comprimir respuestas
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

Activar y verificar:

```bash
sudo ln -s /etc/nginx/sites-available/rummys /etc/nginx/sites-enabled/
sudo nginx -t          # debe decir "syntax is ok"
sudo systemctl reload nginx
```

En este punto la app debe ser accesible por `http://tudominio.com`.

---

## 9. SSL con Let's Encrypt (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Certbot modifica la config de Nginx automáticamente y configura renovación automática. Verificar:

```bash
sudo certbot renew --dry-run
```

Actualizar `CORS_ORIGIN` en la API para usar `https://`:

```bash
cd ~/api
nano .env
# Cambiar: CORS_ORIGIN=https://tudominio.com
pm2 restart rummys-api
```

---

## 10. Actualizar la aplicación (deploys futuros)

### Actualizar la API

```bash
# Subir nuevos archivos desde local
rsync -avz --exclude='node_modules' --exclude='.env' \
  ./api_rummy/ rummys@IP_DEL_VPS:/home/rummys/api/

# En el VPS
cd ~/api
npm install --production
npm run migrate          # aplica sólo migraciones nuevas
pm2 restart rummys-api
```

### Actualizar el frontend

```bash
# Construir localmente y subir el dist
npm run build    # en tu PC local, dentro de /front

rsync -avz ./front/dist/ rummys@IP_DEL_VPS:/home/rummys/front/dist/
# Nginx sirve los archivos estáticos directamente, no hace falta reiniciar nada
```

---

## Referencia rápida de puertos

| Servicio | Puerto | Expuesto |
|----------|--------|----------|
| Nginx | 80, 443 | Sí (internet) |
| Node.js API | 3000 | No (solo localhost) |
| PostgreSQL | 5432 | No (solo localhost) |

---

## Verificar que todo funciona

```bash
# Estado general
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Test de la API (desde el VPS)
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/tabla-general

# Test desde internet
curl https://tudominio.com/api/v1/health
```

---

## Solución de problemas frecuentes

**La API no arranca**
```bash
pm2 logs rummys-api --lines 50
# Verificar que .env existe y DATABASE_URL es correcta
```

**Error 502 Bad Gateway en Nginx**
```bash
# La API no está corriendo
pm2 start rummys-api
# O el puerto es incorrecto — verificar que PORT=3000 en .env y que el proxy_pass en Nginx apunte al mismo puerto
```

**No conecta a PostgreSQL**
```bash
sudo -u postgres psql -c "\du"   # ver usuarios
sudo systemctl status postgresql
# Verificar credenciales en .env
```

**Permisos en la carpeta dist**
```bash
sudo chown -R rummys:rummys /home/rummys/front/dist
sudo chmod -R 755 /home/rummys/front/dist
```
