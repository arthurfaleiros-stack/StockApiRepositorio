create schema public;

use public;

CREATE TABLE public.USUARIO (
  id bigint,
  nome text,
  email text,
  senha_hash t  ext,
  perfil text
);
CREATE TABLE public.ASSINATURA (
  id bigint,
  usuario_id bigint,
  plano text,
  data_inicio text,
  data_fim text,
  status text
);
CREATE TABLE public.CATEGORIA (
  id bigint,
  nome text,
  descricao text
);
CREATE TABLE public.FORNECEDOR (
  id bigint,
  nome text,
  cnpj text,
  contato text,
  endereco text
);
CREATE TABLE public.PRODUTO (
  id bigint,
  categoria_id bigint,
  fornecedor_id bigint,
  nome text,
  codigo text,
  descricao text,
  quantidade_atual bigint,
  quantidade_minima bigint,
  codigo_barras bigint
);
CREATE TABLE public.MOVIMENTACAO (
  id bigint,
  usuario_id bigint,
  produto_id bigint,
  tipo text,
  quantidade bigint,
  data_hora timestamp with time zone,
  observacao text
);
CREATE TABLE public.HISTORICO (
  id bigint,
  usuario_id bigint,
  produto_id bigint,
  movimentacao_id bigint,
  data_hora timestamp with time zone,
  tipo_operacao text,
  descricao text
);