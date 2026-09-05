# KStock-API

> API RESTful corporativa para controle e rastreamento de estoque, movimentações de inventário, auditoria e assinaturas de usuários.

---

## 🛠️ Tecnologias e Arquitetura

- **Linguagem & Runtime**: Node.js v24.x (CommonJS)
- **Framework Web**: Express.js
- **Banco de Dados**: MySQL 8.0 (InnoDB com suporte a transações ACID)
- **Camada de Acesso a Dados**: `mysql2/promise` com pool de conexões reutilizável
- **Segurança**: Helmet, CORS, criptografia com BcryptJS e autenticação JWT (JSON Web Token)
- **Controle de Acesso**: RBAC (Role-Based Access Control) com perfis `ADMIN`, `GERENTE` e `OPERADOR`
- **Uploads**: Multer para upload e validação de imagens de produtos
- **Documentação Interativa**: Swagger UI / OpenAPI 3.0
- **Testes Automatizados**: Jest e Supertest

---

## 🏗️ Estrutura Arquitetural

O projeto adota uma arquitetura em camadas com estrita separação de responsabilidades:

```
Requisição HTTP
    ↓
Middlewares Globais (Helmet, CORS, Express JSON)
    ↓
Rotas (/api/v1/...)
    ↓
Middlewares de Rota (verifyJWT, verifyRole, upload, validação de payload)
    ↓
Controllers (Manipulação HTTP, parsing e respostas)
    ↓
Services (Regras de negócio, transações atômicas de estoque e orquestração)
    ↓
Repositories (Queries SQL parametrizadas e conexão com banco)
    ↓
MySQL 8.0 (Tabelas relacionais com FKs, índices e integridade referencial)
```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+ ou 24+
- MySQL 8.0 instalado ou Docker / Docker Compose

### 1. Clonar o repositório e instalar dependências
```bash
git clone https://github.com/RafaelCairesSantos/KStock-API.git
cd KStock-API
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e ajuste as credenciais do seu banco de dados:
```bash
cp .env.example .env
```

Conteúdo padrão do `.env`:
```ini
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kstock_db
DB_CONNECTION_LIMIT=10

JWT_SECRET=sua_chave_secreta_super_segura_kstock_2026
JWT_EXPIRES_IN=8h
MAX_FILE_SIZE_MB=5
```

### 3. Executar Migrations e População Inicial (Seeds)
```bash
# Cria o banco de dados e as 7 tabelas com relacionamentos e índices
npm run migrate

# Popula usuários de exemplo, categorias, fornecedores e produtos
npm run seed
```

### 4. Iniciar o Servidor
```bash
# Modo de desenvolvimento com reload automático
npm run dev

# Modo de produção
npm start
```

### 5. Execução via Docker Compose
Para subir o banco MySQL 8.0 e a API Node.js de forma 100% conteinerizada:
```bash
docker-compose up -d --build
```

---

## 🧪 Testes Automatizados

Para rodar a suíte completa de testes de regras de negócio, autenticação e contratos HTTP:
```bash
npm test
```

---

## 📑 Documentação da API (Swagger / OpenAPI)

Com o servidor rodando, acesse a interface interativa Swagger no navegador:
👉 **`http://localhost:3000/api/docs`**

---

## 📌 Principais Recursos e Endpoints

### 🔐 Autenticação (`/api/v1/auth`)
| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| `POST` | `/api/v1/auth/register` | Cadastro de novo usuário (`OPERADOR`) | Público |
| `POST` | `/api/v1/auth/login` | Login com e-mail e senha (gera JWT) | Público |
| `GET` | `/api/v1/auth/me` | Dados do usuário autenticado e assinatura | Autenticado |

### 👥 Usuários (`/api/v1/usuarios`)
| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| `GET` | `/api/v1/usuarios` | Listagem paginada e busca | ADMIN |
| `GET` | `/api/v1/usuarios/:id` | Detalhes do usuário | Autenticado |
| `POST` | `/api/v1/usuarios` | Criação com perfil específico | ADMIN |
| `PUT` | `/api/v1/usuarios/:id` | Atualização cadastral | Autenticado / ADMIN |
| `PATCH` | `/api/v1/usuarios/:id/perfil` | Alteração de perfil (RBAC) | ADMIN |
| `DELETE` | `/api/v1/usuarios/:id` | Remoção do usuário | ADMIN |

### 📦 Produtos (`/api/v1/produtos`)
| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| `GET` | `/api/v1/produtos` | Lista produtos com filtros e paginação | Autenticado |
| `GET` | `/api/v1/produtos/alerta-estoque` | Produtos com estoque crítico/baixo | Autenticado |
| `GET` | `/api/v1/produtos/:id` | Detalhes completos do produto | Autenticado |
| `POST` | `/api/v1/produtos` | Cadastro de produto (validação de SKU) | ADMIN, GERENTE |
| `PUT` | `/api/v1/produtos/:id` | Atualização cadastral | ADMIN, GERENTE |
| `POST` | `/api/v1/produtos/:id/foto` | Upload de imagem do produto | ADMIN, GERENTE |
| `DELETE` | `/api/v1/produtos/:id` | Exclusão (bloqueado se houver histórico) | ADMIN |

### 🔄 Movimentações de Estoque (`/api/v1/movimentacoes`)
| Método | Endpoint | Descrição | Acesso |
|--------|----------|-----------|--------|
| `GET` | `/api/v1/movimentacoes` | Histórico paginado com filtros | Autenticado |
| `GET` | `/api/v1/movimentacoes/:id` | Detalhes da movimentação | Autenticado |
| `POST` | `/api/v1/movimentacoes` | Registro atômico (`ENTRADA`, `SAIDA`, `AJUSTE`) | Autenticado |

> **Regra Transacional de Estoque**:
> Toda movimentação é executada em uma transação atômica (`START TRANSACTION` -> `COMMIT`):
> 1. Trava o registro do produto com `SELECT ... FOR UPDATE`.
> 2. Valida o saldo: saídas não podem exceder o saldo disponível (retorna `422 INSUFFICIENT_STOCK`).
> 3. Atualiza `PRODUTO.quantidade_atual`.
> 4. Insere o registro em `MOVIMENTACAO`.
> 5. Insere automaticamente a auditoria em `HISTORICO`.

### 🏷️ Categorias & Fornecedores
- `/api/v1/categorias`: CRUD completo com unicidade de nome e proteção contra exclusão de categorias em uso.
- `/api/v1/fornecedores`: CRUD completo com validação de CNPJ, unicidade e proteção de integridade.

### 📜 Auditoria (`/api/v1/historico`)
- `/api/v1/historico`: Trilha de auditoria detalhada de alterações, movimentações e exclusões (ADMIN, GERENTE).

---

## 🔒 Tratamento Padronizado de Erros

Todas as respostas de erro seguem o formato padronizado:
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Saldo insuficiente em estoque. Saldo disponível: 5, quantidade solicitada para saída: 10.",
    "details": {
      "saldoAtual": 5,
      "quantidadeSolicitada": 10
    }
  }
}
```
