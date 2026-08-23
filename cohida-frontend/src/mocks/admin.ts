import { Boxes, CircleAlert, ClipboardCheck, TrendingUp } from 'lucide-react'

export type AdminResource = 'clientes' | 'estoque' | 'pedidos' | 'produtos' | 'trocas' | 'analises'

export const adminDashboardMetrics = [
  { detail: '+12,5% vs. mês anterior', icon: TrendingUp, label: 'Vendas aprovadas', value: 'R$ 48.760,00' },
  { detail: '6 aguardam aprovação', icon: ClipboardCheck, label: 'Pedidos hoje', value: '28' },
  { detail: '3 produtos abaixo do mínimo', icon: CircleAlert, label: 'Alertas de estoque', value: '7' },
  { detail: '2 aguardam recebimento', icon: Boxes, label: 'Trocas abertas', value: '5' },
]

export const adminRecentOrders = [
  { customer: 'Luana Martins', id: '#COH-1048', status: 'EM PROCESSAMENTO', total: 'R$ 429,90' },
  { customer: 'Gabriel Souza', id: '#COH-1047', status: 'APROVADA', total: 'R$ 1.129,00' },
  { customer: 'Camila Rocha', id: '#COH-1046', status: 'EM TRANSPORTE', total: 'R$ 289,90' },
]

export const adminLowStockProducts = [
  { name: 'Bola de Futebol Pro X', quantity: 1 },
  { name: 'Kit Elástico Resistance', quantity: 2 },
  { name: 'Munhequeira Training', quantity: 3 },
]

export const adminResourceContent: Record<AdminResource, {
  action: string
  columns: string[]
  description: string
  heading: string
  rows: string[][]
}> = {
  produtos: {
    action: 'Novo produto',
    columns: ['Produto', 'Categoria', 'Estoque', 'Preço', 'Status'],
    description: 'Gerencie o catálogo, atributos, precificação e status dos equipamentos.',
    heading: 'Produtos',
    rows: [
      ['Bola de Futebol Pro X', 'Futebol', '18 un.', 'R$ 199,90', 'ATIVO'],
      ['Tênis Run Flow', 'Corrida', '4 un.', 'R$ 459,90', 'ATIVO'],
      ['Kit Elástico Resistance', 'Treino', '1 un.', 'R$ 119,90', 'ATIVO'],
    ],
  },
  estoque: {
    action: 'Registrar entrada',
    columns: ['Produto', 'Disponível', 'Reservado', 'Fornecedor', 'Alerta'],
    description: 'Acompanhe entradas, reservas, níveis disponíveis e alertas de reposição.',
    heading: 'Estoque',
    rows: [
      ['Bola de Futebol Pro X', '18 un.', '2 un.', 'Sport Supply', 'Normal'],
      ['Kit Elástico Resistance', '1 un.', '1 un.', 'Move Brasil', 'Baixo'],
      ['Munhequeira Training', '2 un.', '0 un.', 'Fit Pro', 'Baixo'],
    ],
  },
  pedidos: {
    action: 'Exportar pedidos',
    columns: ['Pedido', 'Cliente', 'Data', 'Total', 'Status'],
    description: 'Valide pagamentos e acompanhe cada transição de fulfilment.',
    heading: 'Pedidos',
    rows: [
      ['#COH-1048', 'Luana Martins', '23 ago. 2026', 'R$ 429,90', 'EM PROCESSAMENTO'],
      ['#COH-1047', 'Gabriel Souza', '23 ago. 2026', 'R$ 1.129,00', 'APROVADA'],
      ['#COH-1046', 'Camila Rocha', '22 ago. 2026', 'R$ 289,90', 'EM TRANSPORTE'],
    ],
  },
  clientes: {
    action: 'Novo cliente',
    columns: ['Cliente', 'Código', 'Compras', 'Perfil', 'Status'],
    description: 'Pesquise perfis, histórico de transações, endereços e status de clientes.',
    heading: 'Clientes',
    rows: [
      ['Luana Martins', 'CLI-0184', '6 pedidos', 'Frequente', 'ATIVO'],
      ['Gabriel Souza', 'CLI-0183', '3 pedidos', 'Recorrente', 'ATIVO'],
      ['Camila Rocha', 'CLI-0182', '1 pedido', 'Novo', 'ATIVO'],
    ],
  },
  trocas: {
    action: 'Ver pendências',
    columns: ['Solicitação', 'Cliente', 'Pedido', 'Produto', 'Status'],
    description: 'Autorize solicitações, confirme recebimentos e gere cupons de troca.',
    heading: 'Trocas',
    rows: [
      ['#TRC-024', 'Renato Lima', '#COH-1027', 'Tênis Run Flow', 'TROCA AUTORIZADA'],
      ['#TRC-023', 'Aline Castro', '#COH-1018', 'Caneleira Pro', 'EM TROCA'],
    ],
  },
  analises: {
    action: 'Exportar planilha',
    columns: ['Categoria', 'Jun.', 'Jul.', 'Ago.', 'Variação'],
    description: 'Compare vendas aprovadas por categoria no período selecionado.',
    heading: 'Análises de vendas',
    rows: [
      ['Futebol', 'R$ 8.420', 'R$ 9.310', 'R$ 11.900', '+27,8%'],
      ['Corrida', 'R$ 7.200', 'R$ 8.100', 'R$ 9.870', '+21,9%'],
      ['Treino', 'R$ 5.900', 'R$ 6.420', 'R$ 7.340', '+14,3%'],
    ],
  },
}
