-----

# ⚕️ Saúde360 - Backend

### *API RESTful para a plataforma de gerenciamento de saúde Saúde360.*

Este repositório contém o código-fonte do backend da plataforma Saúde360. Ele é responsável por toda a lógica de negócio, gerenciamento de dados, autenticação e por servir a API RESTful que alimenta o aplicativo mobile feito em Flutter.

-----

## 🚀 Principais Funcionalidades da API

  * **Autenticação e Autorização:** Sistema de login seguro com JWT (JSON Web Tokens) para pacientes e profissionais.
  * **Gerenciamento de Pacientes:** CRUD completo para os dados dos pacientes.
  * **Gestão de Consultas:** Endpoints para agendamento, remarcação e visualização de consultas.
  * **Prontuário Eletrônico:** Lógica para salvar e recuperar históricos, exames e prescrições.
  * **Integrações:** Endpoints que se conectam a serviços externos para funcionalidades de IA.

-----

## 🛠️ Tecnologias Utilizadas

  * **[Node.js](https://nodejs.org/)**: Ambiente de execução JavaScript no servidor.
  * **[Express.js](https://expressjs.com/pt-br/)**: Framework para construção de APIs de forma rápida e minimalista.
  * **[Supabase](https://supabase.io/) / [PostgreSQL](https://www.postgresql.org/)**: Banco de dados relacional para armazenamento dos dados.
  * **[Prisma](https://www.prisma.io/)**: ORM (Object-Relational Mapping) para facilitar a comunicação com o banco de dados.
  * **[JWT](https://jwt.io/)**: Para criação de tokens de autenticação seguros.

-----

## ✅ Pré-requisitos

Antes de começar, certifique-se de que você tem as seguintes ferramentas instaladas:

  * **Node.js**: Versão 18.x ou superior. ([Baixe aqui](https://nodejs.org/))
  * **NPM** ou **Yarn**: Gerenciador de pacotes (o NPM já vem com o Node.js).
  * **Git**: Para clonar o repositório.

-----

## ⚙️ Instalação

Siga os passos abaixo para configurar o ambiente de desenvolvimento local.

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/DevSaude360/saude360-backend.git
    ```

2.  **Navegue até a pasta do projeto:**

    ```bash
    cd saude360-backend
    ```

3.  **Instale as dependências:**

    ```bash
    # Usando NPM
    npm install

    # Ou, se você usa Yarn
    yarn install
    ```

-----

## 🔑 Variáveis de Ambiente

Este projeto utiliza variáveis de ambiente para armazenar informações sensíveis, como chaves de API e credenciais de banco de dados.

-----

## ▶️ Executando o Servidor

Com tudo configurado, você pode iniciar o servidor.

  * **Para desenvolvimento (com hot-reload):**

    Este comando geralmente utiliza o `nodemon` para reiniciar o servidor automaticamente sempre que um arquivo for alterado.

    ```bash
    npm run dev
    ```

  * **Para produção:**

    Este comando executa a versão estável do servidor.

    ```bash
    npm start
    ```

Após executar um dos comandos, você deverá ver uma mensagem no terminal confirmando que o servidor está rodando, por exemplo: `local host: 5001`.

-----
