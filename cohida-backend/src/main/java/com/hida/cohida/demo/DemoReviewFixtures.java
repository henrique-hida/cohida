package com.hida.cohida.demo;

import java.util.List;

final class DemoReviewFixtures {
  private DemoReviewFixtures() {}

  static List<String> descriptions(String name) {
    if (name.startsWith("Faixa Torah de Judô"))
      return List.of(
          "A cor e o tamanho correspondem ao que eu procurava.",
          "A costura parece firme e a faixa amarra bem.",
          "Bom acabamento para usar nos treinos da semana.",
          "O tecido é resistente e confortável no tatame.",
          "Gostei da qualidade e do caimento depois de amarrada.");
    if (name.contains("Judô")
        || name.contains("Judogi")
        || name.contains("Kimono"))
      return List.of(
          "O kimono veste bem e oferece boa mobilidade no treino.",
          "O tecido parece resistente para treinar com frequência.",
          "Gostei do acabamento e do conforto durante a aula.",
          "O tamanho ficou adequado e permite movimentar os braços.",
          "Boa construção para a rotina no tatame.");
    if (name.contains("Camisa Seleção Japonesa"))
      return List.of(
          "Tecido leve e confortável para jogar e torcer.",
          "Gostei do caimento e das cores da camisa.",
          "Boa ventilação para usar durante a partida.",
          "O material é agradável e seca rápido.",
          "A estampa ficou bonita e o tamanho correspondeu.");
    if (name.startsWith("Tênis"))
      return List.of(
          "O ajuste ficou confortável nos treinos de corrida.",
          "Leve no pé e com boa sensação de amortecimento.",
          "Usei em vários treinos e gostei da estabilidade.",
          "O tamanho correspondeu e o acabamento é caprichado.",
          "Boa opção para corridas e caminhadas do dia a dia.");
    return List.of(
        "O produto correspondeu às informações e chegou em bom estado.",
        "Boa qualidade e acabamento para usar na rotina de treino.",
        "Gostei da praticidade e do conforto durante o uso.",
        "Atendeu bem ao que eu precisava para as atividades esportivas.",
        "Material resistente e fácil de usar nos treinos.");
  }

}
