# 🛠️ NoiseWatch — Guia da Aplicação

Este README descreve **como rodar a aplicação do NoiseWatch**, considerando apenas a parte prática do sistema:

- 🗄️ **Banco de dados PostgreSQL** com Docker
- ⚙️ **Backend** em Node.js + TypeScript + Fastify + Prisma
- 🖥️ **Frontend** em React + Vite
- 📷 **Firmware ESP32-CAM**, que envia a foto para o backend via HTTP

> Este documento é específico da aplicação. Ele não substitui o README geral do projeto acadêmico.

---

## 📌 Visão geral da arquitetura

O fluxo esperado da aplicação é:

```txt
ESP32-CAM detecta som
        ↓
ESP32-CAM captura uma imagem
        ↓
ESP32-CAM envia a imagem via HTTP POST
        ↓
Backend recebe o upload e salva a imagem
        ↓
Backend registra o evento no PostgreSQL
        ↓
Frontend exibe os eventos detectados
```

Principais portas usadas:

| Serviço | Porta | URL padrão |
|---|---:|---|
| PostgreSQL no Docker | `5435` | `localhost:5435` |
| Backend | `3333` | `http://localhost:3333` |
| Frontend | `5173` | `http://localhost:5173` |

---

## ✅ Pré-requisitos

Antes de rodar o projeto, instale:

- **Git**
- **Node.js LTS**
- **npm**
- **Docker**
- **Docker Compose**
- Opcional: **Arduino IDE** ou **PlatformIO**, para gravar o código no ESP32-CAM

---

## 🪟 Instalação no Windows

### 1. Instalar Docker

No Windows, use o **Docker Desktop**.

Passos gerais:

1. Baixe e instale o Docker Desktop.
2. Durante a instalação, habilite o uso com **WSL 2**, se solicitado.
3. Reinicie o computador, se necessário.
4. Abra o Docker Desktop antes de rodar os comandos do projeto.

Verifique no PowerShell ou CMD:

```bash
docker --version
docker compose version
```

Se os comandos responderem a versão instalada, o Docker está funcionando.

---

### 2. Instalar Node.js

Instale a versão **LTS** do Node.js.

Depois confira:

```bash
node --version
npm --version
```

---

## 🐧 Instalação no Linux

### 1. Instalar Docker

Em distribuições baseadas em Ubuntu/Debian, uma forma simples é usar o script oficial de instalação:

```bash
curl -fsSL https://get.docker.com | sh
```

Depois, adicione seu usuário ao grupo `docker`:

```bash
sudo usermod -aG docker $USER
```

Saia e entre novamente na sessão, ou reinicie o computador.

Verifique:

```bash
docker --version
docker compose version
```

---

### 2. Instalar Node.js

Instale uma versão LTS do Node.js. Uma opção comum é usar `nvm`.

Depois confira:

```bash
node --version
npm --version
```

---

## 📥 Clonar o repositório

```bash
git clone -b feat/backend-postgres-upload https://github.com/FelipeSilva96/Trabalho_Interdisciplinar_V.git
cd Trabalho_Interdisciplinar_V
```

Se você já tiver clonado o repositório:

```bash
git checkout feat/backend-postgres-upload
git pull
```

---

## 🗄️ Subir o PostgreSQL com Docker

Na raiz do projeto, onde está o arquivo `docker-compose.yml`, rode:

```bash
docker compose up -d postgres
```

Verifique se o container subiu:

```bash
docker ps
```

Você deve ver um container parecido com:

```txt
noisewatch-postgres
```

O banco usa, por padrão:

```txt
Usuário: noisewatch
Senha: noisewatch
Banco: noisewatch_db
Porta externa: 5435
Porta interna do container: 5432
```

A URL usada pelo backend é:

```env
DATABASE_URL="postgresql://noisewatch:noisewatch@localhost:5435/noisewatch_db?schema=public"
```

---

## ⚙️ Rodar o backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo.

### Windows PowerShell

```bash
Copy-Item .env.example .env
```

### Linux

```bash
cp .env.example .env
```

Confira se o arquivo `backend/.env` está assim:

```env
DATABASE_URL="postgresql://noisewatch:noisewatch@localhost:5435/noisewatch_db?schema=public"
PORT=3333
HOST="0.0.0.0"
PUBLIC_URL="http://localhost:3333"
FRONTEND_ORIGIN="http://localhost:5173"
UPLOAD_DIR="uploads"
MAX_UPLOAD_SIZE_MB=10
```

Gere o client do Prisma:

```bash
npx prisma generate
```

Rode as migrations:

```bash
npx prisma migrate dev
```

Inicie o backend:

```bash
npm run dev
```

Se tudo estiver certo, a API ficará disponível em:

```txt
http://localhost:3333
```

Teste no navegador ou terminal:

```bash
curl http://localhost:3333/health
```

Resposta esperada:

```json
{
  "ok": true,
  "service": "NoiseWatch API",
  "timestamp": "..."
}
```

---

## 🧪 Testar upload manual de imagem

Antes de testar com o ESP32-CAM, teste o backend manualmente com uma imagem qualquer.

### Windows

```bash
curl.exe -X POST "http://localhost:3333/api/events?algorithm=RMS_TWO_STAGE&latencyUs=46" -F "image=@C:\CAMINHO\PARA\SUA\imagem.jpg"
```

Exemplo:

```bash
curl.exe -X POST "http://localhost:3333/api/events?algorithm=RMS_TWO_STAGE&latencyUs=46" -F "image=@C:\Users\Felipe\Pictures\teste.jpg"
```

### Linux

```bash
curl -X POST "http://localhost:3333/api/events?algorithm=RMS_TWO_STAGE&latencyUs=46" -F "image=@./teste.jpg"
```

Se funcionar, o backend responderá algo parecido com:

```json
{
  "ok": true,
  "event": {
    "id": "...",
    "algorithm": "RMS_TWO_STAGE",
    "imageUrl": "http://localhost:3333/uploads/events/..."
  }
}
```

A imagem enviada será salva em:

```txt
backend/uploads/events/
```

---

## 🖥️ Rodar o frontend

Abra outro terminal e volte para a raiz do projeto.

Entre no frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env`.

### Windows PowerShell

```bash
Copy-Item .env.example .env
```

Se não existir `.env.example`, crie manualmente o arquivo `frontend/.env` com:

```env
VITE_API_URL="http://localhost:3333"
```

### Linux

```bash
cp .env.example .env
```

Se não existir `.env.example`, crie manualmente o arquivo `frontend/.env` com:

```env
VITE_API_URL="http://localhost:3333"
```

Rode o frontend:

```bash
npm run dev
```

Abra no navegador:

```txt
http://localhost:5173
```

Se já houver eventos enviados ao backend, eles aparecerão na tela com:

- imagem capturada;
- data/hora;
- algoritmo usado;
- latência, se enviada;
- status do evento.

---

## 📷 Configurar o ESP32-CAM para enviar ao backend

O ESP32-CAM precisa enviar a imagem para o backend usando HTTP.

No arquivo `.ino`, encontre a linha semelhante a:

```cpp
const char *SERVER_URL = "http://IP_LOCAL:3333/api/events?algorithm=RMS_TWO_STAGE";
```

ou:

```cpp
const char* serverUrl = "http://IP_LOCAL:3333/api/events?algorithm=RMS_TWO_STAGE";
```

Troque `IP_LOCAL` pelo IP do computador que está rodando o backend.

Exemplo:

```cpp
const char *SERVER_URL = "http://192.168.0.15:3333/api/events?algorithm=RMS_TWO_STAGE";
```

⚠️ **Não use `localhost` no ESP32-CAM.**

Para o ESP32, `localhost` significa o próprio ESP32, não o seu computador.

---

## 🔎 Como descobrir o IP do computador

### Windows

No PowerShell ou CMD:

```bash
ipconfig
```

Procure o campo **Endereço IPv4** da sua rede Wi-Fi ou Ethernet.

Exemplo:

```txt
Endereço IPv4 . . . . . . . . . . . . . . : 192.168.0.15
```

Nesse caso, o endpoint do ESP32 seria:

```cpp
const char *SERVER_URL = "http://192.168.0.15:3333/api/events?algorithm=RMS_TWO_STAGE";
```

### Linux

No terminal:

```bash
hostname -I
```

ou:

```bash
ip addr
```

Procure um IP parecido com:

```txt
192.168.0.15
```

---

## 📡 Regras importantes para o ESP32 funcionar

Para o upload do ESP32-CAM funcionar:

1. O computador e o ESP32-CAM precisam estar na **mesma rede Wi-Fi**.
2. O backend precisa estar rodando em:

```txt
http://0.0.0.0:3333
```

No `.env`, isso corresponde a:

```env
HOST="0.0.0.0"
PORT=3333
```

3. O ESP32 deve enviar a foto no campo multipart chamado:

```txt
image
```

4. A URL deve apontar para o IP real da máquina, por exemplo:

```txt
http://192.168.0.15:3333/api/events?algorithm=RMS_TWO_STAGE
```

5. Se estiver no Windows, talvez seja necessário permitir o Node.js/backend no firewall.

---

## 🧭 Endpoints principais

### Health check

```http
GET /health
```

Usado para testar se a API está online.

---

### Criar evento com upload de imagem

```http
POST /api/events
```

Formato esperado:

```txt
multipart/form-data
campo do arquivo: image
```

Parâmetros opcionais por query string:

```txt
algorithm=RMS_SIMPLE
algorithm=RMS_TWO_STAGE
latencyUs=46
rms=65000
threshold=50000
```

Exemplo:

```txt
POST /api/events?algorithm=RMS_TWO_STAGE&latencyUs=46
```

---

### Listar eventos

```http
GET /api/events
```

Exemplo:

```txt
GET /api/events?limit=50
```

---

### Buscar evento por ID

```http
GET /api/events/:id
```

---

## 🛑 Parar a aplicação

Para parar o backend ou frontend, pressione:

```bash
CTRL + C
```

Para parar o PostgreSQL:

```bash
docker compose stop postgres
```

Para remover o container, mantendo o volume do banco:

```bash
docker compose down
```

Para remover container **e apagar os dados do banco**:

```bash
docker compose down -v
```

Use `down -v` apenas quando quiser resetar completamente o banco.

---

## 🛠️ Comandos úteis

### Abrir Prisma Studio

Dentro de `backend`:

```bash
npm run prisma:studio
```

Isso abre uma interface visual para inspecionar os dados do banco.

---

### Resetar banco em desenvolvimento

Dentro de `backend`:

```bash
npm run prisma:reset
```

Ou, se quiser apagar também o volume Docker:

```bash
docker compose down -v
docker compose up -d postgres
cd backend
npx prisma migrate dev
```

---

### Ver logs do PostgreSQL

Na raiz do projeto:

```bash
docker logs noisewatch-postgres
```

---

## 🚨 Problemas comuns

### Erro P1000 no Prisma

Erro parecido com:

```txt
P1000: Authentication failed against database server
```

Possíveis causas:

- o banco foi criado com outra senha em um volume antigo;
- o `.env` está usando porta ou senha errada;
- outro PostgreSQL está rodando na mesma porta.

Solução em ambiente de desenvolvimento:

```bash
docker compose down -v
docker compose up -d postgres
cd backend
npx prisma migrate dev
```

---

### Frontend não carrega eventos

Confira se:

1. O backend está rodando.
2. O arquivo `frontend/.env` existe.
3. O conteúdo está correto:

```env
VITE_API_URL="http://localhost:3333"
```

4. A URL abaixo funciona:

```txt
http://localhost:3333/health
```

---

### ESP32 não consegue enviar imagem

Confira:

1. O ESP32 e o computador estão na mesma rede.
2. O IP no `.ino` é o IP real do computador.
3. O backend está rodando.
4. O firewall não está bloqueando a porta `3333`.
5. A URL está assim:

```cpp
const char *SERVER_URL = "http://IP_DO_COMPUTADOR:3333/api/events?algorithm=RMS_TWO_STAGE";
```

6. O campo multipart enviado se chama `image`.

---

## ✅ Sequência recomendada para rodar tudo

Em resumo, rode nesta ordem:

```bash
# 1. Subir banco
docker compose up -d postgres

# 2. Rodar backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# 3. Em outro terminal, rodar frontend
cd frontend
npm install
npm run dev
```

Depois acesse:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:3333/health
```

---

## 📦 Resultado esperado

Ao final, o sistema deve permitir:

- receber imagem enviada pelo ESP32-CAM;
- salvar a imagem no backend;
- registrar o evento no PostgreSQL;
- listar os eventos no frontend;
- visualizar as evidências fotográficas capturadas.
