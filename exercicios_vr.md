# Exercícios para a VR (sem dicionário, sem matriz, sem módulo 1)

Todos os exercícios do material que entram na VR, com os enunciados completos e **sem soluções**.
Faça **sozinha, sem olhar e sem rodar**. Depois rode para conferir.

Assuntos: **strings, tuplas, conjuntos (sets), funções, arquivos, laços com listas e interpretação de código.**

---

## Aula 11: strings (só se o módulo 1 não incluir a aula 11)

**11.1) Gerador de hashtag**
Crie um gerador de hashtags a partir de uma frase. A hashtag deve começar com `#`, ter todas as palavras juntas, e cada palavra deve começar com letra maiúscula.
Exemplo: `"aprender python é legal"` → `#AprenderPythonÉLegal`

**11.2) Partes de uma URL**
Dada uma URL completa, extraia e exiba separadamente o **protocolo**, o **domínio** e o **caminho (path)**.
```python
url = "https://www.exemplo.com.br/produtos/eletronicos"
```
Saída esperada:
```
Protocolo: https
Domínio: www.exemplo.com.br
Caminho: /produtos/eletronicos
```

---

## Aula 12: strings (exercícios)

**12.1) Médias e status**
Você recebeu uma lista de strings, onde cada string contém o nome de um aluno, seguido por suas notas. Calcule a média de cada aluno e determine seu status. A média para aprovação é 7.0.
```python
dados_alunos = [
    "Ana Silva: 8.5, 9.0, 7.5",
    "Bruno Costa: 6.0, 5.5, 7.0",
    "Carla Dias: 9.5, 10.0, 9.0"
]
```
Saída esperada:
```
Ana Silva | Média: 8.33 | Status: Aprovado
Bruno Costa | Média: 6.17 | Status: Reprovado
Carla Dias | Média: 9.50 | Status: Aprovado
```

**12.2) Cifra de César**
Crie uma ferramenta para criptografar e descriptografar mensagens usando a Cifra de César (cada letra é "deslocada" um certo número de posições no alfabeto).
- Três variáveis: `mensagem` (a string), `chave` (inteiro com o deslocamento) e `modo` (`"criptografar"` ou `"descriptografar"`).
- Ignorar espaços e pontuações, mantendo-os como estão.
- Funcionar apenas para letras do alfabeto (sem acentos).
- O alfabeto é circular (depois de `z` vem `a`).
- No modo `"descriptografar"`, o processo é o inverso.

Exemplo de execução:
```
Digite a mensagem: ataque ao amanhecer!
Digite a chave: 3
Digite o modo (c/d): c
Mensagem criptografada: dwdtxh dr dpdqkhfhu!
```

**12.3) Run-Length Encoding (RLE)**
Substitua sequências de letras repetidas pelo número de repetições seguido da própria letra. Exemplo: `AAAABBC` → `4A2B1C`.
```python
string_original = "WWWWBBWWWBWWWWWWWWWWWB"
```
Saída esperada: `"4W2B3W1B11W1B"`

---

## Aula 15: tuplas e conjuntos (questões curtas)

**15.1)** Dada a tupla `coordenadas = (10, 20, 30)`, tente executar `coordenadas[1] = 50`. O que acontece e por quê?

**15.2)** Dada a tupla `notas = (7.5, 8.0, 6.0, 9.0, 8.0, 5.5)`, escreva um código para:
- descobrir quantas vezes a nota 8.0 aparece;
- encontrar em qual índice aparece pela primeira vez a nota 6.0.

**15.3)** Converta a lista abaixo em um set para remover as duplicatas e explique o que acontece com a ordem dos elementos.
```python
emails = ["ana@email.com", "carlos@email.com", "ana@email.com", "beatriz@email.com", "carlos@email.com"]
```

**15.4)** Com os conjuntos abaixo, encontre usando operações de conjuntos:
```python
grupo_a = {"Alice", "Bruno", "Carla", "Daniel"}
grupo_b = {"Carla", "Daniel", "Eduardo", "Fernanda"}
```
1. todos os alunos que participam de qualquer um dos grupos (união);
2. apenas os alunos que participam dos dois grupos (interseção);
3. os alunos que estão no grupo_a, mas não no grupo_b (diferença).

---

## Aula 16: tuplas e conjuntos (exercícios)

**16.1) Coordenadas**
Crie uma lista que armazene 3 tuplas, onde cada tupla representa uma coordenada (lat, long). Peça ao usuário para digitar uma nova coordenada, verifique se ela já existe na lista e exiba `"Local já registrado"` ou `"Novo local adicionado"`.

**16.2) Número por extenso**
Crie uma tupla contendo os números por extenso de "Zero" a "Dez". Peça ao usuário um número inteiro e exiba o nome dele consultando a tupla.

**16.3) Presença nas aulas**
Crie dois conjuntos, `alunos_segunda` e `alunos_quarta`, com nomes de alunos que compareceram a essas aulas. Exiba:
- os alunos que vieram nos dois dias;
- os alunos que vieram apenas na segunda;
- a lista completa de alunos distintos que assistiram a pelo menos uma aula.

**16.4) Palavras únicas**
Peça ao usuário para digitar um texto curto. Transforme o texto em uma lista de palavras e use um conjunto para contar quantas palavras únicas ele utilizou.

---

## Aula 17: funções

**17.1)** Escreva uma função que receba dois números e retorne `True` se o primeiro for múltiplo do segundo.

**17.2)** Escreva uma função que receba o lado (L) de um quadrado e retorne sua área (A = L * L).

**17.3)** Escreva uma função que receba a base e a altura de um triângulo e retorne sua área (A = (base * altura) / 2).

---

## Aula 18: funções (exercícios)

**18.1) Potência**
Crie uma função chamada `potencia` que receba dois números: a base e o expoente.
- Não é permitido usar `**` nem `pow()`. O cálculo deve ser feito com um laço.
- A função deve funcionar com expoente 0 (resultado 1).

**18.2) Média ponderada**
Crie uma função chamada `media_ponderada` que receba uma lista de tuplas, onde cada tupla contém `(nota, peso)`. A função deve calcular e retornar a média ponderada.
```python
[(8.0, 2), (9.0, 3), (7.0, 5)]    # resultado: 7.8
```

---

## Aula 19: arquivos

**19.1) Médias da turma**
Faça um programa que leia um arquivo de notas de alunos, calcule a média de cada aluno e escreva as médias em outro arquivo.

`turma.txt`:
```
Nome,P1,P2,P3
Ana,4.5,5.5,9.8
José,8.2,6.2,2.4
Maria,2.1,10.0,7.5
Otávio,3.3,5.4,6.1
```
`medias.txt` (saída):
```
Nome,Média
Ana,???
José,???
Maria,???
Otávio,???
```

---

## Aula 20: lista estilo prova (sem a questão 5, que é de matriz)

**20.1) Interpretação de código**
```python
def f(v):
    d = len(v)
    q = ( v[0] + v[d-1] ) / 2
    return q

n = int( input("Digite n:") )
x = []
for i in range(n//10, n):
    x.append(i*10)
y = f(x)
```
a) Qual é o tipo do dado armazenado na variável `n`?
b) Quantas funções foram declaradas? Identifique-as.
c) Cite um exemplo de entrada do usuário que levará este programa a um erro.
d) Caso um usuário digite 10, qual valor será atribuído à variável `y`? Justifique.

**20.2)** Escreva uma função que receba uma lista de números e retorne o maior número presente na lista.

**20.3)** Escreva um programa que crie duas listas de números inteiros: uma com os múltiplos de 3 presentes no intervalo [1, 1000] e outra com o restante dos números desse intervalo.

**20.4)** Escreva uma função que receba uma lista de pares de catetos de triângulos retângulos e retorne uma lista com as respectivas hipotenusas. Dica: h² = a² + b².
```python
catetos = [(3, 4), (5, 12), (6, 8)]
hipotenusas = FUNCAO(catetos)
```

**20.6) Estoque com desconto**
Uma loja guarda o estoque no arquivo `estoque.txt`:
```
Água,0003,230,1200,1.99
Refrigerante,0012,450,800,7.99
Pão de Forma,0231,700,100,5.99
```
Campos: Produto, Código (4 dígitos), Vendas (unidades vendidas nos últimos 30 dias), Quantidade (em estoque), Preço.
A gerência quer dar desconto nos produtos que atendam ao critério **Vendas / Quantidade ≤ 0.2**. Escreva um programa que:
a) leia os dados do arquivo `estoque.txt`;
b) aplique 10% de desconto no preço dos produtos que atendam ao critério;
c) escreva os dados atualizados em outro arquivo, `estoque_atualizado.txt`, **no mesmo formato**.

**20.7) Polígonos**
O arquivo `poligonos.txt` guarda dados de polígonos:
```
RET,2.0,0.3
TRI,1.4,1.8
TRI,0.9,2.2
RET,3.0,1.2
```
Campos: Tipo (RET = retângulo, TRI = triângulo), Base, Altura. Área do retângulo = base × altura; área do triângulo = (base × altura) / 2.
a) Leia o arquivo e armazene os dados em uma **lista de tuplas** (uma tupla por linha).
b) A partir dessa lista, crie outra lista com as áreas dos polígonos.
c) Calcule a média aritmética das áreas e imprima na tela.

**20.8) Conjectura de Collatz**
Partindo de um inteiro positivo x: se x for par, o próximo é x / 2; se for ímpar, o próximo é 3x + 1. O processo continua até que o próximo número seja 1.
Escreva um programa que imprima na tela **apenas os números** da sequência, partindo de um x informado pelo usuário.
Exemplo para x = 6: `6 3 10 5 16 8 4 2 1`

---

## Da sua prova (P2)

**P2.3) Contar letras**
Dada uma string, gere outra string com a quantidade de cada letra seguida da letra.
Exemplo: `"aaaabbbbb"` → `"4a5b"` · `"abacab"` → `"3a2b1c"`
(Faça **sem dicionário**, como você fez na prova, e não esqueça o `str()`.)
