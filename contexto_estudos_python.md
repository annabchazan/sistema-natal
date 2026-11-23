# Contexto para continuar os estudos de Python (recuperação / VS)

Este arquivo resume uma sessão longa de estudos, para que uma nova sessão possa continuar de onde parou.

## Situação
- Disciplina: Lab. de Resolução de Problemas (Python). Última disciplina da faculdade.
- A aluna já cursou a disciplina antes, mas precisou refazer porque a carga horária aumentou.
- Tirou **1 de 10** na prova. Vai fazer a **VS (recuperação) com a matéria toda**.
- Ainda falta saber: a data da VS e se a "matéria toda" inclui aulas antes da 12.
- Sugestão pendente: falar com a coordenação sobre aproveitamento/complementação de carga horária.

## Como o professor corrige (lição da prova)
- Dá **pouco ou nenhum crédito parcial**. O código precisa estar **certo, completo e com sintaxe correta**.
- Ideia/lógica certa com erro de sintaxe (ex.: faltar `str()`) **não salva a questão**.

## Prova que ela fez (questões que caíram)
1. (4 pts) Multiplicação de matrizes (ela fez só 2 `for`, errou) + matriz transposta.
2. (3 pts) Função que recebe uma **lista de dicionários** (cada um com nome e lista de notas) e o **nome de um arquivo**; calcula a média de cada aluno e escreve nome e média, uma linha por aluno. Ela errou o acesso: escreveu `dados = alunos.itens`, `nome = dados[0]`, `notas = dados["nome"]`.
3. (3 pts) Dada uma string, gerar outra com a quantidade de cada letra (ex.: `4a5b`). Ela fez a lógica certa (string auxiliar para letras já contadas + `for` contando), mas **esqueceu o `str()`** ao concatenar.

## Material das aulas (PDFs enviados pela aluna — precisam ser reenviados numa nova sessão)
- Aula 12: exercícios de strings (médias no formato `"Ana Silva: 8.5, 9.0, 7.5"` com saída `Ana Silva | Média: 8.33 | Status: Aprovado`; Cifra de César com `input`; RLE `WWWWBBWWWBWWWWWWWWWWWB` → `4W2B3W1B11W1B`).
- Aula 13: matrizes (acesso, laços aninhados, lista 3D, diagonal principal, transposta).
- Aula 14: Jogo da Velha, multiplicação de matrizes, lista 3D `[Escola][Aluno][Bimestre]`.
- Aula 15: tuplas, sets, dicionários (teoria + 6 questões curtas).
- Aula 16: 7 exercícios de tupla, set e dicionário.
- Aula 17: funções (escopo, global, parâmetros, módulos) + 3 exercícios.
- Aula 18: 4 exercícios de funções (potência com laço, média ponderada com tuplas, filtrar lista de dicionários por gênero, banco de dados com dicionário aninhado).
- Aula 19: arquivos (`open`, modos, `read`/`readlines`/`write`/`close`, `splitlines`/`split`) + exercício `turma.txt` → `medias.txt`.
- Aula 20: lista estilo prova com 8 questões (interpretação de código, maior da lista, múltiplos de 3 em [1, 1000], hipotenusas, máx/mín de matriz, estoque com desconto em arquivo, polígonos com lista de tuplas, Collatz).

## Pontos fracos identificados
- **Formato de saída / detalhes do enunciado** ("retorne" × "imprima", "apenas", "mesmo formato", nome exato do arquivo, critério de aprovação).
- **Mesma variável com dois papéis** (acumular na variável do `for`).
- **Conversões**: `str()` ao juntar número com texto; converter lista com `append(float(x))`; `int("6.0")` dá erro.
- **Lista de dicionários**: um `for` na lista e depois `d["chave"]`; `.items()` só em dicionário e com `()`.
- **Multiplicação de matrizes** (3 `for`, `C[i][j] += A[i][k] * B[k][j]`).
- **Operadores**: `*` × `**`, `^` não é potência, `/` dá float, `//` inteiro.
- `range` sem o último número; `(dado)` não é tupla; tupla não tem `append`.
- Sabe bem: `for` aninhado, padrão "guardar o maior", contagem com `d.get(x, 0) + 1`, leitura de arquivo com `split`.

## Método combinado para a recuperação
1. Ela escreve **sozinha, sem olhar e sem rodar**, como na prova.
2. Correção **rigorosa**, como o professor: erro que quebra o código é erro grave.
3. Depois ela roda no computador para confirmar.
4. Se errou, refaz o mesmo exercício outro dia, até sair certo de primeira.
5. Ordem: refazer **todos os exercícios** das listas (aula 12 → 20), insistindo nos pontos fracos.

## Onde parou
Começando a refazer tudo pela **aula 12, exercício 1** (formato do professor, com `split(":")` e depois `split(",")`).

## Materiais já criados
- `colinha_prova_python.md` (neste repositório): colinha com as pegadinhas dela.
- Simulado de 20 questões objetivas: https://claude.ai/artifact/6EuRZ83Qcxuj5eWGbQk2V3
