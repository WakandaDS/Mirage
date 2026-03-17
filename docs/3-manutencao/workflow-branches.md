# Workflow de Branches

> Regra de sessão: o trabalho de código acontece em `dev`. O branch `main` é o estado estável e é onde ficamos localmente no fim de cada sessão.

---

## Regra geral

```
main  → branch estável, nunca trabalhamos diretamente aqui
dev   → branch de trabalho, todas as alterações vão aqui primeiro
```

---

## Início de sessão — ir para dev

```bash
git checkout dev
git pull origin dev
```

---

## Durante o trabalho — commit em dev

```bash
git add <ficheiros>
git commit -m "feat: descrição do que foi feito"
```

Ou para commitar tudo de uma vez:

```bash
git add -p   # interativo, ficheiro a ficheiro (recomendado)
# ou
git add src/ docs/   # só as pastas relevantes, evitar git add -A
git commit -m "feat: descrição"
```

---

## Fim de sessão — merge para main e voltar

```bash
# 1. Garantir que dev está atualizado no remote
git push origin dev

# 2. Ir para main
git checkout main

# 3. Sincronizar main com o remote (caso haja commits remotos)
git pull --rebase origin main

# 4. Fazer merge de dev
git merge dev

# 5. Push de main
git push origin main
```

---

## Trabalho inacabado — mudar para main a meio

Se for preciso mudar para `main` com trabalho por acabar em `dev`:

```bash
# Opção A — commitar o estado intermédio com WIP
git add <ficheiros>
git commit -m "wip: descrição do que falta"
git checkout main

# Opção B — guardar com stash (sem commitar)
git stash push -m "wip: descrição do que falta"
git checkout main

# Para retomar depois:
git checkout dev
git stash pop   # só se usaste opção B
```

> ⚠️ **Nota:** Se houver WIP em `dev`, NÃO fazer merge para `main` até o trabalho estar concluído e testado.

---

## Build antes de merge

O `dist/` está no `.gitignore` mas convém garantir que o build está funcional antes de mergear:

```bash
npm run build
```

---

## Verificar estado antes de sair

```bash
git status          # confirmar que não há alterações pendentes
git branch          # confirmar que estamos em main
git log --oneline -5  # confirmar os últimos commits
```
