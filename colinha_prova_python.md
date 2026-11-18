# Colinha final: as SUAS pegadinhas de Python

## 1. Releia o enunciado (o erro nº 1!)
Antes de entregar cada questão, confira:
- [ ] **"Retorne"** → `return` · **"Exiba/imprima"** → `print`
- [ ] O **formato da saída** está igual ao pedido? (espaços, vírgulas, `:`, 2 casas)
- [ ] O **nome do arquivo** é exatamente o pedido?
- [ ] Fiz **todos os itens**? (as 3 tuplas, a mensagem do `else`...)
- [ ] O critério está certo? (`>= 6` ou `>= 7`?)
- [ ] O enunciado diz **"apenas"**? Então não imprima nada a mais.

## 2. Uma variável = um papel só
```python
for nota, peso in lista:
    peso += peso          # ERRADO: o peso do for apaga a soma
    soma_pesos += peso    # CERTO: nome diferente para acumular
```
- Nunca reutilize o nome da **lista** que você ainda está percorrendo.
- No padrão "guardar o maior", a variável do `if` tem que ser a **mesma** que é atualizada.

## 3. Teste com mais de um exemplo
Vários códigos deram certo **por sorte**. **Mude a ordem dos dados** ou use outros números.

## 4. Texto × número
| situação | o que fazer |
|---|---|
| `input()`, arquivo e `split` | sempre devolvem **texto** → `int()` / `float()` |
| `"6.0"` | `float("6.0")` funciona · `int("6.0")` dá erro |
| juntar número com texto | `str(4) + "A"` ou f-string |
| `write()` | só aceita **texto** → `f"{media:.2f}\n"` |
| `"0003"` (código) | **não converta**, senão perde os zeros |

## 5. Converter uma lista
```python
for t in textos:
    t = float(t)              # ERRADO: não muda a lista
notas = []
for t in textos:
    notas.append(float(t))    # CERTO
```
`float(lista)` dá erro: ele converte **um** valor por vez.

## 6. Operadores
| | |
|---|---|
| `**` | potência · o `^` **NÃO** é potência |
| `** 0.5` | raiz quadrada |
| `/` | sempre dá **float** (`6 / 2 = 3.0`) |
| `//` | divisão inteira (`7 // 2 = 3`) |
| `%` | resto (`x % 2 == 0` → par; `a % b == 0` → múltiplo) |

## 7. range
- `range(1, 100)` vai até **99**. Para incluir o N: `range(1, N + 1)`
- `range(0)` não repete nenhuma vez (útil no expoente 0!)

## 8. Índices e estruturas
- Tudo começa do **0**. A última posição é `[-1]`.
- Na matriz, **o nome também ocupa uma coluna**: `["Carla", 9.5, 8.5, 10.0]` → a última nota é `[3]`.
- "Coluna 1" é o **índice 1**.
- `len(m)` → linhas · `len(m[i])` → colunas.

**Como percorrer? Olhe o 1º símbolo da estrutura:**
| estrutura | for |
|---|---|
| `[ ... ]` | `for item in lista:` |
| `{k: v}` | `for k, v in d.items():` ← **com `()`!** |
| `[ {...}, {...} ]` | `for d in lista:` → `d["campo"]` |
| `{k: {...}}` | `for k, d in dic.items():` → `d["campo"]` |
| `[(a, b), ...]` | `for a, b in lista:` |

## 9. Valores iniciais
| padrão | começa com |
|---|---|
| soma / contador | `0` |
| multiplicação | `1` |
| maior / menor | o **primeiro elemento** `v[0]` |
| lista que vai ser montada | `[]` |
| texto que vai ser montado | `""` |

Onde zerar: **dentro** do `for` se for "por linha/escola/célula", e **antes de tudo** se for "geral".

## 10. Dicionários e sets
- `pop` **devolve o valor** removido · `del` só apaga.
- `d.get(chave, 0)` não quebra se a chave não existir.
- Contar: `d[x] = d.get(x, 0) + 1`
- `{}` é **dicionário** · set vazio é `set()`.
- Set: `&` interseção · `|` união · `-` diferença · sem ordem e sem índice.

## 11. Sintaxe
- Métodos precisam de `()`: `.items()`, `.close()`, `.read()`
- `ord` é letra → número, e `chr` é número → letra. Não use `ord` em algo que já é número.
- Aspas mudam tudo: `base` é a variável, e `'base'` é só um texto.
- No f-string, **só o que está dentro de `{}`** vira valor.
- O `else` fica **alinhado** com o `if`.
- `a, b = 7` dá erro (o número de variáveis tem que ser igual ao de valores).

## 12. Arquivos
- `open(nome, "r")` lê · `"w"` **apaga tudo** e escreve · `"a"` acrescenta no final.
- `read()` → string · `readlines()` → lista de linhas · `splitlines()` → lista sem `\n`
- Pule o **cabeçalho**: `linhas[1:]`
- O `write` **não pula linha**, então use o `\n`.
- Feche com `close()` (ou use o `with`).
- Linha em branco no fim do arquivo → `if linha.strip() == "": continue`

## 13. Questões de "o que o código faz?"
- Simule no papel, **anotando cada variável**.
- Calcule o `range` **antes** de começar o `for`.
- Entradas que dão erro: **texto** no `int()` (`ValueError`), **lista vazia** com `[0]` (`IndexError`), **divisão por 0** (`ZeroDivisionError`), `0` no Collatz (**loop infinito**).
- Funções **declaradas** são só as que têm `def`.

## Na prova
Leia o enunciado com calma → escreva → teste na cabeça com um exemplo → releia o enunciado.
