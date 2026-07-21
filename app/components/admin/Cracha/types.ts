export interface CartinhaParaCracha {
  id: number;
  nome_crianca: string;
  idade: number;
  numero_sequencial: number | null;
  instituicao_id: number;
  nome_instituicao: string;
  status: string;
  necessidade_especial: boolean;
  observacao_especial: string | null;
}

export interface InstituicaoOption {
  id: number;
  nome_instituicao: string;
}
