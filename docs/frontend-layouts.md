# Layouts e componentes do frontend

Os layouts são definidos nas rotas em `src/App.tsx`. `StorefrontLayout` fornece
navegação e rodapé da loja; `AdminLayout` fornece navegação e proteção do painel.
As páginas com cabeçalho usam o componente `Page`, que padroniza o cabeçalho,
a largura e o espaçamento do conteúdo. A escolha do layout geral continua na
rota. Para uma página comum:

```tsx
<Page
  title='Produtos'
  description='Encontre seus equipamentos.'
  action={<Button>Filtrar</Button>}
  overlap
>
  <ProductList />
</Page>
```

`description`, `eyebrow` e `action` são opcionais. Use `overlap` para sobrepor
o conteúdo ao cabeçalho. Títulos e ações podem usar diretamente os dados e
callbacks da página. Páginas administrativas usam `AdminPage`, que fornece o
espaçamento padrão e aceita as mesmas props de `Page`. Home e autenticação usam
`PlainPageLayout` e podem usar `PageContainer`.

## Seções

`Section` oferece um contêiner responsivo e espaçamento vertical. Use
`className` para a seção externa e `contentClassName` para o contêiner interno;
as demais props, como `id` e atributos de acessibilidade, são encaminhadas ao
`section`:

```tsx
<Section
  id='beneficios'
  className='bg-muted'
  contentClassName='grid gap-6 sm:grid-cols-3'
>
  {/* Conteúdo da seção */}
</Section>
```

Quando o conteúdo já estiver dentro de um contêiner de largura, uma seção HTML
simples pode evitar contêineres e espaçamentos duplicados.

## Componentes reutilizáveis

Antes de repetir classes, estrutura ou regras de acessibilidade em várias
páginas, procure um componente existente. Quando houver um padrão recorrente,
crie um wrapper em `components/ui` ou no domínio apropriado, inclusive para
componentes do shadcn. O wrapper deve fornecer os padrões compartilhados e
aceitar props tipadas, como `className`, `variant` ou `size`, quando houver
variações reais. Não crie wrappers para usos únicos sem responsabilidade comum.

Por exemplo, formulários administrativos podem usar `AdminInput` e
`AdminTextarea`. Eles já aplicam o estilo padrão e aceitam as props nativas,
inclusive `className` quando for necessário ajustar um caso específico:

```tsx
<AdminInput name='name' required />
<AdminTextarea name='description' rows={4} required />
```

Procure manter cada arquivo com até 300 linhas. Ao crescer, separe componentes,
hooks e utilitários por responsabilidade, evitando divisão apenas por contagem.
