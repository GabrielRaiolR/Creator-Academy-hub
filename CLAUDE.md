@AGENTS.md

# Migrations do banco

Sempre que um PR trouxer arquivo novo em `db/migrations`, rode a migration no Neon de produção antes do deploy ou junto com ele. Se o código chegar à Vercel antes da tabela, a página que consulta essa tabela quebra em produção.
