// Campanha 2026: a cliente já mandou imprimir as cartinhas físicas com numeração própria,
// então o número precisa ser digitado manualmente ao cadastrar (bate com o número impresso).
// gerarNumeroSequencial() em app/actions/cartinhas.ts continua intacta — quando a numeração
// automática voltar a fazer sentido (cartinhas não pré-numeradas), basta virar `false` aqui
// que o formulário e o salvarCartinha() voltam a gerar o número sozinhos, sem retrabalho.
export const NUMERACAO_MANUAL_CARTINHAS = true;
