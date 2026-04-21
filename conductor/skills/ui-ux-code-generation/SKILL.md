---
name: ui-ux-code-generation
version: 1.0.0
description: >
  Gera código frontend (HTML/CSS/JS/React) focado em resiliência visual.
  Elimina Layout Shifts (CLS), trata dados ausentes e garante fallbacks
  visuais e semânticos do consumo da tarefa até a entrega do artefato.
triggers:
  - "criar tela"
  - "criar componente UI"
  - "layout responsivo"
  - "corrigir layout quebrado"
  - "UI com fallback"
  - "/criar-ui"
---

# UI/UX CODE GENERATOR — Interfaces resilientes, sem CLS e à prova de fallback

> **Propósito**: Transformar requisitos de interface em código de produção que não quebra — previnindo colapso de layout, vazamento de nulos e ausência de feedback visual.

## Filosofia Central

1. **Defensive Rendering** — Nunca assuma a forma ou presença dos dados.
   Na prática: use optional chaining (`?.`) e nullish coalescing (`??`) em todo binding de UI.
2. **Layout Imutability** — Containers pai nunca devem colapsar se o conteúdo falhar.
   Na prática: sempre use `min-height` em vez de `height`, e defina dimensões fallback para mídia.
3. **Accessibility by Default** — ARIA e navegação por teclado não são adições, são a base.
   Na prática: todo elemento interativo recebe `role` (se não for semântico), `aria-label` e estilização `:focus-visible`.
4. **Graceful Degradation** — Falhas de rede ou dados não podem destruir o esqueleto visual.
   Na prática: isole o carregamento de dados do carregamento de estrutura (skeletons primeiro, dados depois).

## Quando Ativar

### ✅ Ativar para:
- Criar componentes do zero (botões, cards, modais, formulários)
- Refatorar layout propenso a *Cumulative Layout Shift* (CLS)
- Adicionar resiliência a telas que recebem dados dinâmicos (APIs)
- Implementar estados obrigatórios: Default, Loading, Empty, Error

### ❌ NÃO ativar para:
- Definir paleta de cores, tipografia ou espaçamentos base do design system → use `design-system-creator`
- Arquitetura de estado (Redux, Context, Zustand) → use `frontend-design`
- Extrair especificações de arquivos `.fig` ou imagens → use `figma-parser`

## Escopo e Limites

**Cobre:**
- Estrutura HTML5 semântica e acessível.
- CSS (Modules, Tailwind, Styled-Components) focado em grid/flexbox resiliente.
- Componentes React/Vue/DOM puro com tratamento de bordas.
- Estados visuais de exceção (Skeleton, Fallback, Erro).

**Delega:**
- Lógica de validação de formulários complexa → `form-validation`
- Requisições HTTP e tratamento de cache → `api-integration`

## Protocolo de Execução

1. **Mapear Riscos** — Identifique no prompt onde podem ocorrer falhas: textos longos, imagens inexistentes, arrays vazios, tela pequena.
2. **Estruturar o Esqueleto** — Escreva o HTML semântico (`<section>`, `<article>`, `<nav>`) *antes* de adicionar estilos ou lógica.
3. **Definir Contratos de Espaço** — Aplique `min-height`, `min-width` e `overflow` nos containers raiz para garantir que a área de pintura nunca colapse.
4. **Codificar os 4 Estados** — Implemente o componente trocando entre: `Loading` (Skeleton) → `Success` (Dados) → `Empty` (Mensagem clara) → `Error` (Call-to-action de retry).
5. **Sanitizar Entradas Visuais** — Garanta truncamento de texto (`text-overflow: ellipsis`) e fallback de imagem (`onError` ou tag `<picture>`).
6. **Testar Mentalmente** — Simule: "E se o texto tiver 500 caracteres? E se a imagem der 404? E se o array for null?". Ajuste o código.
7. **Empacotar Artefato** — Entregue o código em um único bloco copiável, ou forneça o comando exato de build/execução (ex: `npx vite`).

## Padrões Específicos

### 1. Container Anti-Colapso

**Regra**: Use `min-height` para reservar espaço na tela, evitando que elementos irmãos saltem quando o conteúdo some.

```css
/* ✅ PASS — Reserva espaço, não quebra se vazio */
.card-container {
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

/* ❌ FAIL — Se o conteúdo interno falhar, o container some (CLS) */
.card-container {
  height: 200px;
}
```

**Por que importa**: Impede Layout Shifts (CLS) que frustram o usuário e penalizam o SEO do Google.

---

### 2. Tratamento de Textos Dinâmicos

**Regra**: Nunca permita que um texto longo quebre o grid ou o flexbox pai.

```jsx
/* ✅ PASS — Trunca com reticências e mostra o título completo no hover/foco */
<span className="overflow-hidden text-ellipsis whitespace-nowrap" title={user.bio}>
  {user.bio}
</span>

/* ❌ FAIL — Texto de 2000 caracteres estoura o card lateral */
<span>{user.bio}</span>
```

**Por que importa**: Textos de sistemas externos (APIs, CMS) não têm limite garantido. O layout deve ser à prova de tamanho.

---

### 3. Fallback de Mídia (Imagens/Ícones)

**Regra**: Toda tag `<img>` deve ter fallback visual ou nativo para falha de carregamento.

```jsx
/* ✅ PASS — Troca para placeholder se a URL falhar */
<img 
  src={product.image} 
  alt={`Foto de ${product.name}`}
  onError={(e) => { e.target.src = '/images/placeholder.png'; e.target.onerror = null; }}
  className="object-cover w-full h-48 bg-gray-100" /* bg-gray-100 é o fallback do carregamento */
/>

/* ❌ FAIL — Imagem quebrada exibe o ícone feio de 'X' nativo do navegador */
<img src={product.image} alt="Produto" />
```

**Por que importa**: APIs de catálogo frequentemente retornam URLs expiradas ou corrompidas. O UI não pode depender do sucesso absoluto do CDN.

---

### 4. Renderização Defensiva de Listas

**Regra**: Nunca acesse propriedades de um array sem verificar sua existência e tamanho.

```jsx
/* ✅ PASS — Lida com null, undefined e array vazio de forma elegante */
{!comments ? (
  <SkeletonRows count={3} />
) : comments.length === 0 ? (
  <EmptyState message="Nenhum comentário ainda." />
) : (
  <ul>{comments.map(c => <li key={c.id}>{c.text}</li>)}</ul>
)}

/* ❌ FAIL — Quebra a tela inteira se a API retornar `null` ao invés de `[]` */
<ul>
  {comments.map(c => <li key={c.id}>{c.text}</li>)}
</ul>
```

**Por que importa**: Um `Cannot read properties of null (reading 'map')` renderiza uma tela em branco (White Screen of Death) para o usuário final.

## Anti-Padrões Críticos

| Anti-padrão | Consequência | Alternativa Correta |
| :--- | :--- | :--- |
| Usar `display: none` no estado de Loading | Causa CLS severo ao sumir com o skeleton e aparecer o conteúdo | Use `visibility: hidden` ou mantenha o Skeleton com as mesmas dimensões do conteúdo real |
| `height: 100%` em cascata | Colapso em árvore se um ancestral perder altura | Use `min-height: 100vh/dvh` ou Grid com `grid-template-rows: 1fr` no body |
| `<div onclick="...">` | Inacessível por teclado e não lido como botão por leitores de tela | Use `<button type="button">` e aplique CSS para resetar o estilo nativo |
| Remover outline do foco (`outline: none`) | Usuários de teclado/navegação por voz perdem a posição atual | Use `outline: 2px solid var(--focus-color)` no `:focus-visible` |

## Critérios de Qualidade

Antes de entregar o artefato, confirme:

- [ ] Frontmatter completo e triggers mapeados
- [ ] HTML utiliza tags semânticas (`<main>`, `<section>`, `<button>`)
- [ ] Containers pai usam `min-height` em vez de `height`
- [ ] Textos dinâmicos possuem regra de truncamento (`text-overflow` ou clamp)
- [ ] Imagens possuem `alt` descritivo e fallback `onError` ou fundo cinza (`bg-gray-100`)
- [ ] Listas/Arrays verificam `null` e `.length === 0` antes do `.map()`
- [ ] Componente cobre 4 estados: Default, Loading (Skeleton), Empty, Error
- [ ] Foco interativo (`:focus-visible`) está visível e estilizado
- [ ] Código fornecido em bloco único e pronto para copiar/colar no arquivo alvo

## Referências Cruzadas

| Precisa de... | Use a skill... |
| :--- | :--- |
| Definir tokens visuais (cores, fontes) | `design-system-creator` |
| Gerenciar estado global dos componentes | `frontend-design` |
| Validar inputs de formulários | `form-validation` |
| Converter design do Figma em código | `figma-parser` |

---

## Exemplo Completo (End-to-End)

**Contexto do Usuário**: "Crie um card de perfil de usuário para uma sidebar."

**Artefato Gerado (Resiliência Máxima):**

```tsx
import React from 'react';

// Estados de Exceção
const Skeleton = () => (
  <div className="animate-pulse flex items-center gap-3">
    <div className="w-12 h-12 rounded-full bg-gray-300" />
    <div className="flex-1 space-y-2 py-1">
      <div className="h-3 w-3/4 rounded bg-gray-300" />
      <div className="h-2 w-1/2 rounded bg-gray-200" />
    </div>
  </div>
);

const ErrorFallback = ({ onRetry }: { onRetry: () => void }) => (
  <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-center min-h-[80px] flex flex-col justify-center">
    <p className="text-sm text-red-600 font-medium">Erro ao carregar perfil.</p>
    <button onClick={onRetry} className="text-xs text-red-500 underline mt-1 hover:no-underline">
      Tentar novamente
    </button>
  </div>
);

// Componente Principal
export const UserProfileCard = ({ user, isLoading, hasError, onRetry }) => {
  // 1. Tratamento de Erro Crítico
  if (hasError) return <ErrorFallback onRetry={onRetry} />;

  // 2. Tratamento de Carregamento (Mesmo tamanho do Success para evitar CLS)
  if (isLoading) return <Skeleton />;

  // 3. Tratamento de Dados Ausentes (Empty State)
  if (!user) return null; 

  return (
    <aside 
      className="p-4 border rounded-lg min-h-[80px] flex items-center gap-3"
      aria-label={`Perfil do usuário ${user.name ?? 'Não identificado'}`}
    >
      {/* 4. Fallback de Imagem e Espaço Reservado */}
      <img 
        src={user.avatar} 
        alt={`Avatar de ${user.name}`}
        className="w-12 h-12 rounded-full object-cover bg-gray-100 flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
          (e.target as HTMLImageElement).onerror = null;
        }}
      />

      <div className="flex-1 min-w-0"> {/* min-w-0 essencial para flexbox com texto */}
        {/* 5. Fallback de Texto e Truncamento */}
        <h3 
          className="text-sm font-bold text-gray-800 truncate"
          title={user.name}
        >
          {user.name ?? 'Usuário Anônimo'}
        </h3>
        
        <p 
          className="text-xs text-gray-500 truncate"
          title={user.role}
        >
          {user.role ?? 'Cargo não informado'}
        </p>
      </div>
    </aside>
  );
};