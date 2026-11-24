package com.hida.cohida.demo;

import java.util.List;
import java.util.Map;

final class DemoChatFixtures {
  private DemoChatFixtures() {}

  static Map<String, List<String>> suggestions() {
    return Map.of(
        "football", List.of(
            "Como escolher uma chuteira?",
            "Qual bola é adequada para treinar?",
            "Que equipamentos preciso para jogar futebol?",
            "Como cuidar dos meus equipamentos de futebol?"),
        "running", List.of(
            "Como escolher um tênis para corrida?",
            "O que preciso para começar a correr?",
            "Quais acessórios podem ajudar na corrida?",
            "Como cuidar do meu tênis de corrida?"),
        "training", List.of(
            "Quais equipamentos ajudam no treino em casa?",
            "Como escolher roupas para treinar?",
            "O que preciso para começar a treinar?",
            "Como cuidar dos meus equipamentos de treino?"),
        "outdoor", List.of(
            "Como escolher calçados para uma trilha?",
            "O que levar para uma caminhada ao ar livre?",
            "Como escolher uma mochila para trilha?",
            "Quais acessórios são úteis em uma aventura?"),
        "martial-arts", List.of(
            "Como escolher um judogi?",
            "O que preciso para começar uma arte marcial?",
            "Como escolher uma faixa?",
            "Como cuidar dos equipamentos de artes marciais?"));
  }
}
