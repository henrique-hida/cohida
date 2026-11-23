package com.hida.cohida.demo;

import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantRequest;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;

/** Product and variation fixtures shared by the demonstration seed. */
final class DemoCatalogFixtures {
  List<ProductUpsertRequest> products() {
    return List.of(
        product(
            "Bola Strike Pro",
            "DEMO-BAL-001",
            "Bola de futebol para partidas e treinos.",
            List.of(1L),
            14990,
            sizedVariants("DEMO-BAL-001", 14990, null, List.of("4", "5"), "5")),
        product(
            "Tênis Velocity Runner",
            "DEMO-RUN-001",
            "Tênis leve para treinos e corridas diárias.",
            List.of(2L),
            39990,
            sizedVariants(
                "DEMO-RUN-001",
                39990,
                "Preto",
                List.of("39", "40", "41", "42", "43", "44"),
                "41")),
        product(
            "Kit PowerBand",
            "DEMO-TRN-001",
            "Faixas em níveis de resistência para treino funcional.",
            List.of(3L),
            8990,
            choices("DEMO-TRN-001", 8990, List.of("Leve", "Média", "Forte"))),
        product(
            "Mochila Trail 18L",
            "DEMO-OUT-001",
            "Mochila compacta para trilhas e atividades ao ar livre.",
            List.of(4L),
            22990,
            colorVariants(
                "DEMO-OUT-001",
                22990,
                List.of("Verde", "Preto", "Azul"),
                "Verde")),
        product(
            "Chuteira Apex Field",
            "DEMO-FTB-002",
            "Chuteira de campo com ajuste confortável.",
            List.of(1L),
            25990,
            sizedVariants(
                "DEMO-FTB-002",
                25990,
                "Preto",
                List.of("38", "39", "40", "41", "42", "43"),
                "40")),
        catalogProduct(
            "Camisa Seleção Japonesa Titular",
            "Adidas",
            "Camisa azul da seleção japonesa de futebol, modelo titular.",
            List.of(1L),
            9990,
            "/products/jersey-japan-home.jpg",
            sizedVariants(
                "DEMO-FTB-003",
                9990,
                "Azul",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Garrafa Térmica 700 ml",
            "DEMO-TRN-002",
            "Garrafa térmica para manter a hidratação durante o treino.",
            List.of(3L, 4L),
            7990,
            colorVariants(
                "DEMO-TRN-002",
                7990,
                List.of("Verde", "Preto", "Azul"),
                "Verde")),
        product(
            "Tapete Flow",
            "DEMO-TRN-003",
            "Tapete antiderrapante para mobilidade e treino funcional.",
            List.of(3L),
            12990,
            choices(
                "DEMO-TRN-003",
                12990,
                List.of("Cinza 6 mm", "Azul 6 mm", "Verde 8 mm"))),
        product(
            "Relógio Pace",
            "DEMO-RUN-002",
            "Relógio esportivo para acompanhar tempo e ritmo.",
            List.of(2L),
            49990,
            colorVariants(
                "DEMO-RUN-002",
                49990,
                List.of("Preto", "Azul", "Verde"),
                "Preto")),
        product(
            "Meia Trail Performance",
            "DEMO-OUT-002",
            "Meia ventilada para corrida e trilhas.",
            List.of(2L, 4L),
            3990,
            sizedVariants(
                "DEMO-OUT-002",
                3990,
                "Preto",
                List.of("35–38", "39–42", "43–46"),
                "39–42")),
        product(
            "Lanterna Trail Beam",
            "DEMO-OUT-003",
            "Lanterna recarregável para aventuras em baixa luminosidade.",
            List.of(4L),
            15990,
            colorVariants(
                "DEMO-OUT-003", 15990, List.of("Verde", "Preto"), "Verde")),
        product(
            "Jaqueta Wind Shell",
            "DEMO-OUT-004",
            "Jaqueta leve corta-vento para corridas e atividades externas.",
            List.of(4L, 2L),
            21990,
            sizedVariants(
                "DEMO-OUT-004",
                21990,
                "Verde",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Judogi Essencial",
            "DEMO-MAR-001",
            "Kimono de judô para treinos frequentes no tatame.",
            List.of(5L),
            28990,
            matrixVariants(
                "DEMO-MAR-001",
                28990,
                List.of("Branco", "Azul"),
                List.of("A0", "A1", "A2", "A3", "A4"))),
        beltColorProduct(
            "Faixa Torah de Judô Verde",
            "DEMO-MAR-002",
            "Verde",
            "belt-judo-green.png",
            4990),
        catalogProduct(
            "Camisa Seleção Japonesa Reserva",
            "Adidas",
            "Camisa branca da seleção japonesa de futebol, modelo reserva.",
            List.of(1L),
            9990,
            "/products/jersey-japan-away.jpg",
            sizedVariants(
                "DEMO-CAMISA-M",
                9990,
                "Branco",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Tênis Road Sprint",
            "DEMO-TENIS-40",
            "Tênis de corrida leve para treinos diários.",
            List.of(2L),
            34990,
            sizedVariants(
                "DEMO-TENIS-40",
                34990,
                "Preto",
                List.of("39", "40", "41", "42", "43"),
                "40")),
        torahProduct(
            "Judô Trançado Plus Adulto",
            "DEMO-JDO-001",
            "Judogi Torah trançado para treinos adultos de judô.",
            58900,
            "DEMO-JDO-001",
            "Judogi Trançado Plus Torah",
            List.of("Branco", "Azul"),
            List.of("A0", "A1", "A2", "A3", "A4")),
        torahProduct(
            "Judô Trançado Plus Infantil",
            "DEMO-JDO-002",
            "Judogi Torah infantil para prática e treino de judô.",
            39900,
            "DEMO-JDO-002",
            "Judogi Plus Torah Infantil",
            List.of("Branco", "Azul"),
            List.of("M00", "M0", "M1", "M2", "M3", "M4")),
        torahProduct(
            "Judô Trançado Advanced Adulto",
            "DEMO-JDO-003",
            "Judogi Torah Trançado Advanced para judocas adultos.",
            69900,
            "DEMO-JDO-003",
            "Judogi Advanced Torah",
            List.of("Branco", "Azul"),
            List.of("A0", "A1", "A2", "A3", "A4")),
        torahProduct(
            "Judô Trançado Advanced Infantil",
            "DEMO-JDO-004",
            "Judogi Torah Trançado Advanced em tamanhos infantis.",
            48900,
            "DEMO-JDO-004",
            "Judogi Advanced Torah Infantil",
            List.of("Branco", "Azul"),
            List.of("M00", "M0", "M1", "M2", "M3", "M4")),
        torahProduct(
            "Kimono Judô Iniciante Adulto",
            "DEMO-JDO-005",
            "Kimono Torah para quem está começando no judô.",
            32900,
            "DEMO-JDO-005",
            "Kimono Iniciante Torah",
            List.of("Branco", "Azul"),
            List.of("A0", "A1", "A2", "A3", "A4", "A5")),
        torahProduct(
            "Kimono Judô Iniciante Infantil",
            "DEMO-JDO-006",
            "Kimono Torah para os primeiros treinos infantis de judô.",
            27900,
            "DEMO-JDO-006",
            "Kimono Iniciante Torah Infantil",
            List.of("Branco", "Azul"),
            List.of("M00", "M0", "M1", "M2", "M3", "M4")),
        beltColorProduct(
            "Faixa Torah de Judô Branca",
            "DEMO-BELT-WHITE",
            "Branco",
            "belt-judo-white.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Cinza",
            "DEMO-BELT-GRAY",
            "Cinza",
            "belt-judo-gray.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Amarela",
            "DEMO-BELT-YELLOW",
            "Amarelo",
            "belt-judo-yellow.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Laranja",
            "DEMO-BELT-ORANGE",
            "Laranja",
            "belt-judo-orange.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Azul Royal",
            "DEMO-BELT-ROYAL-BLUE",
            "Azul Royal",
            "belt-judo-blue.png",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Azul Celeste",
            "DEMO-BELT-LIGHT-BLUE",
            "Azul Celeste",
            "belt-judo-light-blue.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Roxa",
            "DEMO-BELT-PURPLE",
            "Roxo",
            "belt-judo-purple.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Marrom",
            "DEMO-BELT-BROWN",
            "Marrom",
            "belt-judo-brown.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Vermelha",
            "DEMO-BELT-RED",
            "Vermelho",
            "belt-judo-red.jpg",
            4990),
        beltColorProduct(
            "Faixa Torah de Judô Preta",
            "DEMO-BELT-BLACK",
            "Preto",
            "belt-judo-black.jpg",
            4990),
        catalogProduct(
            "Bolsa Torah",
            "Torah",
            "Bolsa esportiva Torah para transportar kimono e acessórios.",
            List.of(5L),
            14900,
            "/products/torah-bag.png",
            colorVariants(
                "DEMO-JDO-011", 14900, List.of("Azul", "Preto"), "Azul")),
        catalogProduct(
            "Mochila Torah",
            "Torah",
            "Mochila Torah para levar equipamentos aos treinos.",
            List.of(5L),
            16900,
            "/products/torah-backpack.webp",
            choices("DEMO-JDO-012", 16900, List.of("Compacta", "Grande"))),
        catalogProduct(
            "Sacola Torah",
            "Torah",
            "Sacola Torah prática para transportar roupas de treino.",
            List.of(5L),
            8900,
            "/products/torah-sacola.jpg",
            colorVariants(
                "DEMO-JDO-013", 8900, List.of("Azul", "Branca"), "Azul")),
        product(
            "Joelheira de Treino",
            "DEMO-TRN-004",
            "Par de joelheiras para exercícios e treino funcional.",
            List.of(3L, 5L),
            7990,
            sizedVariants(
                "DEMO-TRN-004", 7990, "Preto", List.of("P", "M", "G"), "M")),
        product(
            "Corda de Pular Speed",
            "DEMO-TRN-005",
            "Corda ajustável para aquecimento e condicionamento físico.",
            List.of(3L),
            5990,
            colorVariants(
                "DEMO-TRN-005",
                5990,
                List.of("Preto", "Vermelho", "Azul"),
                "Preto")),
        product(
            "Luvas de Academia Grip",
            "DEMO-TRN-006",
            "Luvas com palma aderente para exercícios com pesos.",
            List.of(3L),
            6990,
            sizedVariants(
                "DEMO-TRN-006",
                6990,
                "Preto",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Bola de Vôlei Arena",
            "DEMO-VOL-001",
            "Bola de vôlei para partidas recreativas e treinos.",
            List.of(3L),
            12990,
            sizedVariants("DEMO-VOL-001", 12990, null, List.of("4", "5"), "5")),
        product(
            "Caneleira Shield",
            "DEMO-FTB-004",
            "Caneleira leve para proteção durante partidas de futebol.",
            List.of(1L),
            4990,
            sizedVariants(
                "DEMO-FTB-004",
                4990,
                "Preto e laranja",
                List.of("P", "M", "G"),
                "M")),
        product(
            "Luva de Goleiro Block",
            "DEMO-FTB-005",
            "Luva de goleiro para treinos e jogos de futebol.",
            List.of(1L),
            11990,
            sizedVariants(
                "DEMO-FTB-005",
                11990,
                "Verde",
                List.of("8", "9", "10", "11"),
                "9")),
        product(
            "Shorts Run Pace",
            "DEMO-RUN-004",
            "Shorts leve para corrida e treino ao ar livre.",
            List.of(2L),
            8990,
            sizedVariants(
                "DEMO-RUN-004",
                8990,
                "Preto",
                List.of("P", "M", "G", "GG"),
                "M")),
        product(
            "Cinto de Hidratação Trail",
            "DEMO-OUT-005",
            "Cinto compacto para levar água e itens essenciais em corridas.",
            List.of(4L, 2L),
            9990,
            List.of(
                variant(
                    "DEMO-OUT-005", "Tamanho único", "Preto", null, 9990, 20))),
        product(
            "Boné Outdoor UV",
            "DEMO-OUT-006",
            "Boné leve para atividades esportivas ao ar livre.",
            List.of(4L),
            6990,
            colorVariants(
                "DEMO-OUT-006",
                6990,
                List.of("Preto", "Azul", "Verde"),
                "Preto")),
        product(
            "Faixa Elástica de Alongamento",
            "DEMO-TRN-007",
            "Faixa longa para alongamento, mobilidade e fisioterapia.",
            List.of(3L),
            2990,
            choices("DEMO-TRN-007", 2990, List.of("Leve", "Média", "Forte"))),
        product(
            "Meião Futebol Match",
            "DEMO-FTB-006",
            "Meião de cano alto para treinos e partidas de futebol.",
            List.of(1L),
            3990,
            sizedVariants(
                "DEMO-FTB-006",
                3990,
                "Branco",
                List.of("35–38", "39–42", "43–46"),
                "39–42")));
  }

  private ProductUpsertRequest product(
      String name,
      String sku,
      String description,
      List<Long> categoryIds,
      long price,
      List<ProductVariantRequest> variants) {
    return catalogProduct(
        name,
        "coHida",
        description,
        categoryIds,
        price,
        imageUrlForSku(sku),
        variants);
  }

  private ProductUpsertRequest catalogProduct(
      String name,
      String brand,
      String description,
      List<Long> categoryIds,
      long price,
      String imageUrl,
      List<ProductVariantRequest> variants) {
    return new ProductUpsertRequest(
        name, brand, description, imageUrl, categoryIds, 1, true, variants);
  }

  private ProductVariantRequest variant(
      String sku,
      String label,
      String color,
      String size,
      long price,
      int stock) {
    return new ProductVariantRequest(sku, label, color, size, price, stock);
  }

  private List<ProductVariantRequest> sizedVariants(
      String baseSku,
      long price,
      String color,
      List<String> sizes,
      String defaultSize) {
    List<ProductVariantRequest> result = new ArrayList<>();
    for (String size : sizes) {
      String sku =
          size.equals(defaultSize) ? baseSku : baseSku + "-" + skuToken(size);
      result.add(variant(sku, "Tamanho " + size, color, size, price, 12));
    }
    return result;
  }

  private List<ProductVariantRequest> colorVariants(
      String baseSku, long price, List<String> colors, String defaultColor) {
    List<ProductVariantRequest> result = new ArrayList<>();
    for (String color : colors) {
      String sku =
          color.equals(defaultColor)
              ? baseSku
              : baseSku + "-" + skuToken(color);
      result.add(variant(sku, color, color, null, price, 12));
    }
    return result;
  }

  private List<ProductVariantRequest> choices(
      String baseSku, long price, List<String> labels) {
    List<ProductVariantRequest> result = new ArrayList<>();
    for (int index = 0; index < labels.size(); index++) {
      String label = labels.get(index);
      String sku = index == 0 ? baseSku : baseSku + "-" + skuToken(label);
      result.add(variant(sku, label, null, label, price, 12));
    }
    return result;
  }

  private List<ProductVariantRequest> matrixVariants(
      String baseSku, long price, List<String> colors, List<String> sizes) {
    List<ProductVariantRequest> result = new ArrayList<>();
    for (String color : colors) {
      for (String size : sizes) {
        String sku =
            color.equals(colors.getFirst()) && size.equals("A2")
                ? baseSku
                : baseSku + "-" + skuToken(color) + "-" + skuToken(size);
        result.add(variant(sku, color + " / " + size, color, size, price, 12));
      }
    }
    return result;
  }

  private ProductUpsertRequest beltColorProduct(
      String name, String baseSku, String color, String image, long price) {
    return catalogProduct(
        name,
        "Torah",
        "Faixa de judô Torah na cor " + color + " para treinos e graduação.",
        List.of(5L),
        price,
        "/products/" + image,
        sizedVariants(
            baseSku,
            price,
            color,
            List.of("A2", "A0", "A1", "A3", "A4"),
            "A2"));
  }

  private ProductUpsertRequest torahProduct(
      String name,
      String skuPrefix,
      String description,
      long price,
      String sku,
      String labelPrefix,
      List<String> colors,
      List<String> sizes) {
    List<ProductVariantRequest> options = new ArrayList<>();
    for (String color : colors) {
      for (String size : sizes) {
        String colorCode =
            color
                .toUpperCase(java.util.Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "");
        String sizeCode =
            size.toUpperCase(java.util.Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        String variantSku =
            color.equals(colors.getFirst()) && size.equals(sizes.getFirst())
                ? skuPrefix
                : skuPrefix + "-" + colorCode + "-" + sizeCode;
        options.add(
            new ProductVariantRequest(
                variantSku,
                labelPrefix + " " + color + " / " + size,
                color,
                size,
                price,
                8));
      }
    }
    return new ProductUpsertRequest(
        name,
        "Torah",
        description,
        imageUrlForSku(sku),
        List.of(5L),
        1,
        true,
        options);
  }

  private String skuToken(String value) {
    return Normalizer.normalize(value, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toUpperCase(java.util.Locale.ROOT)
        .replaceAll("[^A-Z0-9]+", "");
  }

  private String imageUrlForSku(String sku) {
    if (sku.startsWith("DEMO-JDO-001")) return "/products/torah-judo-plus.jpg";
    if (sku.startsWith("DEMO-JDO-002"))
      return "/products/torah-judo-plus-infantil.jpg";
    if (sku.startsWith("DEMO-JDO-003"))
      return "/products/torah-judo-advanced-white.png";
    if (sku.startsWith("DEMO-JDO-004"))
      return "/products/torah-judo-plus-infantil.jpg";
    if (sku.startsWith("DEMO-JDO-005"))
      return "/products/torah-judo-beginner.jpg";
    if (sku.startsWith("DEMO-JDO-006"))
      return "/products/torah-judo-infant-beginner.png";
    if (sku.startsWith("DEMO-BELT-WHITE"))
      return "/products/belt-judo-white.jpg";
    if (sku.startsWith("DEMO-BELT-GRAY")) return "/products/belt-judo-gray.jpg";
    if (sku.startsWith("DEMO-BELT-YELLOW"))
      return "/products/belt-judo-yellow.jpg";
    if (sku.startsWith("DEMO-BELT-ORANGE"))
      return "/products/belt-judo-orange.jpg";
    if (sku.startsWith("DEMO-BELT-ROYAL-BLUE"))
      return "/products/belt-judo-blue.png";
    if (sku.startsWith("DEMO-BELT-LIGHT-BLUE"))
      return "/products/belt-judo-light-blue.jpg";
    if (sku.startsWith("DEMO-BELT-PURPLE"))
      return "/products/belt-judo-purple.jpg";
    if (sku.startsWith("DEMO-BELT-BROWN"))
      return "/products/belt-judo-brown.jpg";
    if (sku.startsWith("DEMO-BELT-RED")) return "/products/belt-judo-red.jpg";
    if (sku.startsWith("DEMO-BELT-BLACK"))
      return "/products/belt-judo-black.jpg";
    String filename = switch (sku) {
      case "DEMO-CAMISA-M" -> "jersey-japan-away.jpg";
      case "DEMO-TENIS-40" -> "tenis-road-sprint.png";
      case "DEMO-BAL-001" -> "bola-strike-pro.png";
      case "DEMO-RUN-001" -> "tenis-velocity-runner.png";
      case "DEMO-TRN-001" -> "kit-powerband.png";
      case "DEMO-OUT-001" -> "mochila-trail-18l.png";
      case "DEMO-FTB-002" -> "chuteira-apex-field.png";
      case "DEMO-FTB-003" -> "jersey-japan-home.jpg";
      case "DEMO-TRN-002" -> "garrafa-termica-700ml.png";
      case "DEMO-TRN-003" -> "tapete-flow.png";
      case "DEMO-RUN-002" -> "relogio-pace.png";
      case "DEMO-OUT-002" -> "meia-trail-performance.png";
      case "DEMO-OUT-003" -> "lanterna-trail-beam.png";
      case "DEMO-OUT-004" -> "jaqueta-wind-shell.png";
      case "DEMO-MAR-001" -> "judogi-essencial.png";
      case "DEMO-MAR-002" -> "belt-judo-green.png";
      case "DEMO-JDO-007", "DEMO-JDO-008", "DEMO-JDO-009", "DEMO-JDO-010" ->
              "torah-belt-white.jpg";
      case "DEMO-JDO-011" -> "torah-bag.png";
      case "DEMO-JDO-012" -> "torah-backpack.webp";
      case "DEMO-JDO-013" -> "torah-sacola.jpg";
      case "DEMO-TRN-004" -> "demo-knee-sleeve.jpg";
      case "DEMO-TRN-005" -> "demo-jump-rope.jpg";
      case "DEMO-TRN-006" -> "demo-gym-gloves.jpg";
      case "DEMO-VOL-001" -> "demo-volleyball.jpg";
      case "DEMO-FTB-004" -> "demo-shin-guards.jpg";
      case "DEMO-FTB-005" -> "demo-goalie-gloves.jpg";
      case "DEMO-RUN-004" -> "demo-running-shorts.jpg";
      case "DEMO-OUT-005" -> "demo-hydration-belt-clean.jpg";
      case "DEMO-OUT-006" -> "demo-running-cap.jpg";
      case "DEMO-TRN-007" -> "stretch-band.jpg";
      case "DEMO-FTB-006" -> "demo-football-socks.jpg";
      default -> null;
    };
    return filename == null ? null : "/products/" + filename;
  }
}
