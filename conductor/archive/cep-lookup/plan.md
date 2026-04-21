# Plano de Implementação: Consulta CEP com ViaCEP

## Fase 1: Setup e Estrutura Base

**Objetivo:** Criar estrutura de arquivos e HTML semântico

### Tarefas

1. [x] Criar diretório do projeto e arquivos base
2. [x] Criar estrutura HTML semântica
3. [x] Adicionar meta tags e viewport

---

## Fase 2: Estilização CSS

**Objetivo:** Implementar design visual moderno e responsivo

### Tarefas

4. [x] Criar variáveis CSS (cores, espaçamentos)
5. [x] Estilizar container principal e card
6. [x] Estilizar input de CEP com máscara visual
7. [x] Estilizar botão de consulta
8. [x] Estilizar área de resultados
9. [x] Adicionar estados de loading e erro
10. [x] Implementar responsividade (media queries)
11. [x] Adicionar animações e transições

---

## Fase 3: Lógica JavaScript

**Objetivo:** Implementar funcionalidade de consulta

### Tarefas

12. [x] Implementar máscara de input (00000-000)
13. [x] Validar formato do CEP
14. [x] Implementar função de consulta ViaCEP (fetch)
15. [x] Tratar resposta da API
16. [x] Exibir resultados na tela
17. [x] Implementar tratamento de erros (CEP não encontrado, rede)
18. [x] Adicionar loading state
19. [x] Permitir consulta via tecla Enter

---

## Fase 4: Testes e Refinamento

**Objetivo:** Garantir qualidade e experiência perfeita

### Tarefas

20. [x] Testar com CEPs válidos (diferentes estados)
21. [x] Testar CEP inválido (menos de 8 dígitos)
22. [x] Testar CEP não existente
23. [x] Testar responsividade em diferentes telas
24. [x] Ajustar detalhes visuais finos

---

## Estrutura de Arquivos

### Artefatos da Track (planejamento)

```
conductor/tracks/cep-lookup/
├── index.md
├── plan.md
└── spec.md
```

### Código do Projeto (deliverable)

```
projects/cep-lookup/
├── index.html
├── styles.css
└── app.js
```

## Notas

- ViaCEP é uma API pública gratuita, não requer autenticação
- CEPs de exemplo para teste:
  - São Paulo/SP: 01001000 (Praça da Sé)
  - Rio de Janeiro/RJ: 20040002
  - Belo Horizonte/MG: 30140071