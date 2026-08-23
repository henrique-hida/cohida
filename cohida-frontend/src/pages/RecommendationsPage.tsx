import { Sparkles } from "lucide-react";
import { Link } from "react-router";

import { PageContainer, Price, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { products, recommendations } from "@/mocks";

export function RecommendationsPage() {
  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <PageContainer className="py-10 sm:py-14">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <p className="text-sm font-medium">Feito para o seu ritmo</p>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Recomendações que acompanham seus objetivos
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            Usamos seus interesses e pedidos para destacar equipamentos
            relevantes. Você controla seus dados a qualquer momento.
          </p>
        </div>
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Selecionados para você</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((recommendation) => {
              const product = products.find(
                (item) => item.id === recommendation.productId,
              );
              return product ? (
                <Card key={product.id}>
                  <img
                    alt={product.images[0]?.alt}
                    className="aspect-[4/3] w-full object-cover"
                    src={product.images[0]?.src}
                  />
                  <CardContent className="p-5">
                    <Badge variant="secondary">{recommendation.reason}</Badge>
                    <h3 className="mt-3 font-semibold">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {recommendation.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Price priceCents={product.priceCents} />
                      <Button
                        render={<Link to={`/produtos/${product.slug}`} />}
                        size="sm"
                        variant="outline"
                      >
                        Ver produto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })}
          </div>
        </section>
        <section className="mt-12 rounded-2xl bg-muted p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            Quer uma sugestão mais específica?
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Abra o assistente no canto da tela e conte seu esporte, rotina e
            objetivo. Ele encontra o ponto de partida ideal.
          </p>
          <p className="mt-5 text-sm font-medium text-primary">
            Use o botão “Precisa de ajuda?” para conversar.
          </p>
        </section>
      </PageContainer>
    </div>
  );
}
