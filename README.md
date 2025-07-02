CRUD Cadastro - Projeto de Treino
Este é um projeto de treino para implementação de um CRUD (Create, Read, Update, Delete) básico usando Node.js, Express e Sequelize com PostgreSQL.

Tecnologias Utilizadas
Node.js

Express

Sequelize (ORM)

PostgreSQL (banco de dados)

Jest (para testes)

Supertest (para testes de API)

Pré-requisitos
Node.js (versão 18 ou superior)

PostgreSQL instalado e rodando

npm ou yarn

Instalação
Clone o repositório:

bash
git clone [URL_DO_REPOSITORIO]
cd tdd-test_3
Instale as dependências:

bash
npm install
Crie um arquivo .env na raiz do projeto com as seguintes variáveis:

text
DB_NAME=nome_do_banco
DB_USER=usuario_postgres
DB_PASSWORD=senha_postgres
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=sua_chave_secreta_jwt
Execute as migrações do Sequelize:

bash
npx sequelize-cli db:migrate
Como Executar
Para iniciar o servidor em modo de desenvolvimento (com nodemon):

bash
npm start
O servidor estará disponível em http://localhost:3000 (ou na porta configurada no seu arquivo .env).

Executando Testes
Para executar os testes com Jest:

bash
npm test
Estrutura do Projeto
src/server.js - Ponto de entrada da aplicação

src/controllers/ - Lógica dos controllers

src/models/ - Modelos do Sequelize

src/routes/ - Definição das rotas

src/middlewares/ - Middlewares customizados

src/tests/ - Testes da aplicação

Endpoints da API
(Descreva aqui os endpoints disponíveis na sua API, métodos HTTP, parâmetros, exemplos de request/response)

Contribuição
Este é um projeto de treino, mas contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

Licença
MIT