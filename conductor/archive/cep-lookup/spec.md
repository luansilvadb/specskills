# Especificação: Consulta CEP com ViaCEP

## Visão Geral
Aplicação web simples e elegante para consulta de CEPs brasileiros, consumindo a API pública ViaCEP.

## Funcionalidades

### Core
1. **Input de CEP**
   - Campo de entrada com máscara (00000-000)
   - Validação de formato (8 dígitos)
   - Botão de consulta
   - Tecla Enter aciona a busca

2. **Consulta ViaCEP**
   - Requisição GET para `https://viacep.com.br/ws/{cep}/json/`
   - Tratamento de CEP não encontrado
   - Tratamento de erro de rede
   - Loading state durante a consulta

3. **Exibição de Resultados**
   - Logradouro
   - Bairro
   - Cidade/Localidade
   - Estado (UF)
   - CEP formatado
   - Complemento (quando disponível)
   - Código IBGE (bônus)

4. **UX/UI**
   - Design moderno e limpo
   - Animações suaves
   - Feedback visual de erro
   - Layout responsivo (mobile-first)
   - Cores agradáveis e acessíveis

## Requisitos Técnicos

### API ViaCEP
- Endpoint: `https://viacep.com.br/ws/{cep}/json/`
- Método: GET
- Resposta: JSON
- Rate limit: não documentado (uso razoável)

### Validações
- CEP deve conter exatamente 8 dígitos numéricos
- Remover caracteres não numéricos antes da consulta
- Exibir mensagem clara para CEP inválido
- Exibir mensagem para CEP não encontrado

### Estrutura de Resposta ViaCEP
```json
{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "complemento": "lado ímpar",
  "unidade": "",
  "bairro": "Sé",
  "localidade": "São Paulo",
  "uf": "SP",
  "estado": "São Paulo",
  "regiao": "Sudeste",
  "ibge": "3550308",
  "gia": "1004",
  "ddd": "11",
  "siafi": "7107"
}
```

## Design Guidelines

### Paleta de Cores
- **Primária:** #4F46E5 (indigo)
- **Secundária:** #10B981 (emerald para sucesso)
- **Erro:** #EF4444 (red)
- **Fundo:** #F9FAFB (gray-50)
- **Card:** #FFFFFF
- **Texto:** #1F2937 (gray-800)
- **Texto secundário:** #6B7280 (gray-500)

### Tipografia
- Fonte: Inter ou system-ui
- Tamanhos: 14px, 16px, 20px, 24px

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Critérios de Aceite
- [ ] Consulta funciona com CEP válido
- [ ] Mensagem de erro para CEP inválido
- [ ] Mensagem de erro para CEP não encontrado
- [ ] Loading state durante consulta
- [ ] Layout responsivo funciona em mobile
- [ ] Máscara de input funcionando
- [ ] Design visual agradável