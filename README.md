# Sistema de Crediário Próprio - OC CDC

Um sistema completo e eficiente para controle de crediário em pequenos comércios, lojas ou vendedores autônomos.

## 🚀 Funcionalidades
- Cadastro de clientes com informações detalhadas
- Controle de vendas a prazo com parcelamento
- Acompanhamento de parcelas e datas de vencimento
- Histórico de pagamentos com múltiplos métodos
- Dashboard com métricas e indicadores
- Relatórios e análises financeiras
- Gestão de usuários com controle de acesso
- Interface simples e intuitiva

## 🛠 Tecnologias Utilizadas
- Next.js 14 (App Router)
- React com TypeScript
- Tailwind CSS e shadcn/ui para componentes
- Supabase (Autenticação e Banco de Dados)
- Recharts para visualização de dados
- Lucide React para ícones

## 📋 Pré-requisitos
- Node.js 18 ou superior
- npm, yarn ou pnpm
- Conta no Supabase (gratuita disponível em https://supabase.com/)

## 🎯 Como usar

### 1. Clone este repositório:
```bash
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo
```

### 2. Instale as dependências:
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com base no `.env.example`:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e adicione suas credenciais do Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

### 5. Acesse a aplicação:
Abra seu navegador e acesse http://localhost:3000

## 🔧 Configuração do Supabase

1. Acesse https://app.supabase.com/ e crie uma conta gratuita
2. Crie um novo projeto
3. Após a criação, vá para Settings > API
4. Copie o URL do projeto e a chave anônima (anon key)
5. Cole essas informações no arquivo `.env.local`

## 📊 Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas:
- `users`: Gerenciamento de usuários e permissões
- `customers`: Cadastro de clientes
- `sales`: Registro de vendas
- `installments`: Controle de parcelas
- `payments`: Histórico de pagamentos

## 👥 Controle de Acesso

O sistema possui três níveis de usuários:
- **Vendedor**: Acesso básico a vendas e clientes
- **Loja**: Acesso completo às funcionalidades
- **Master**: Acesso administrativo e gerenciamento de usuários

## 📈 Relatórios

O sistema oferece relatórios detalhados com:
- Métricas financeiras em tempo real
- Gráficos de evolução de vendas
- Análise de parcelas em atraso
- Exportação de dados em CSV

## 📞 Contato
Desenvolvido por: **MC TL Vendas**
Email: mctlvendas@gmail.com