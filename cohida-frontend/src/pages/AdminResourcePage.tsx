import { Download, Plus, Search, SlidersHorizontal } from 'lucide-react'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adminResourceContent, type AdminResource } from '@/mocks'

export function AdminResourcePage({ resource }: { resource: AdminResource }) {
  const page = adminResourceContent[resource]
  const isExport = page.action.startsWith('Exportar')

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-semibold tracking-tight">{page.heading}</h1><p className="mt-2 max-w-2xl text-muted-foreground">{page.description}</p></div>
        <Button>{isExport ? <Download /> : <Plus />}{page.action}</Button>
      </div>
      <Card className="mt-8">
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Lista operacional</CardTitle><CardDescription>Dados demonstrativos até a integração com a API.</CardDescription></div>
          <div className="flex gap-2"><label className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-9 w-60 rounded-lg border border-input bg-background pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Pesquisar" /></label><Button aria-label="Filtros" size="icon-lg" variant="outline"><SlidersHorizontal /></Button></div>
        </CardHeader>
        <CardContent className="overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase"><tr>{page.columns.map((column) => <th className="pb-3 font-medium" key={column}>{column}</th>)}</tr></thead><tbody>{page.rows.map((row) => <tr className="border-b border-border last:border-0" key={row[0]}>{row.map((cell, index) => <td className="py-4" key={cell}>{index === row.length - 1 ? <Badge variant={cell.includes('BAIXO') || cell.includes('PROCESSAMENTO') || cell.includes('TROCA') ? 'secondary' : 'outline'}>{cell}</Badge> : index === 0 ? <span className="font-medium">{cell}</span> : cell}</td>)}</tr>)}</tbody></table></CardContent>
      </Card>
    </AdminLayout>
  )
}
