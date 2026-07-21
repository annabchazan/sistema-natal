export interface CartinhaItem {
  id: number;
  nome_crianca: string;
  idade: number;
  texto_cartinha: string;
  presente_pedido: string;
  instituicao_id: number;
  nome_instituicao?: string;
  tag_id: number | null;
  numero_sequencial?: number;
  foto_cartinha?: string | null;
  data_limite_entrega?: string | null;
  status: string;
  necessidade_especial?: boolean;
  observacao_especial?: string | null;
}

export interface InstituicaoOption {
  id: number;
  nome_instituicao: string;
}

export interface TagOption {
  id: number;
  nome: string;
}
