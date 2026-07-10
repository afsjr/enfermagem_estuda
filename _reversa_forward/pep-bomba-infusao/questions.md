# Perguntas para Refinamento — Simulador PEP + Bomba de Infusão

> **Instruções**: Preencha as respostas diretamente abaixo de cada pergunta.  
> Use `✅` para confirmar, `❌` para negar, ou escreva livremente.  
> Última atualização: 2026-07-10

---

## 🏥 Simulador PEP (Prontuário Eletrônico do Paciente)

### 1. Cenários Clínicos Pré-Definidos
**Pergunta**: Devo incluir pacientes fictícios prontos para prática (ex: "Maria, 45 anos, pós-operatório de colecistectomia") ou o aluno deve criar o caso do zero?

**Resposta**: _[Preencha aqui]_

---

### 2. Quantidade de Cenários
**Pergunta**: Quantos cenários iniciais seriam ideais? Sugiro 5 perfis diversificados:
- Paciente pós-cirúrgico adulto
- Paciente idoso com fratura de fêmur  
- Gestante com pré-eclâmpsia
- Paciente pediátrico com desidratação
- Paciente com diabetes descompensada

**Resposta**: _[Preencha aqui ou sugira outros]_

---

### 3. Validação Automática
**Pergunta**: O simulador deve validar o preenchimento do aluno com feedback educacional? (Ex: "Você registrou um diagnóstico de enfermagem mas não associou nenhuma intervenção — isso compromete a continuidade do cuidado")

**Resposta**: _[Preencha aqui]_

---

### 4. Integração com IA (Gemini)
**Pergunta**: Deseja que o Tutor MonicAI possa:
- (a) Gerar cenários clínicos aleatórios com base em um tema?
- (b) Corrigir o PEP preenchido pelo aluno com feedback personalizado?
- (c) Ambos?
- (d) Nenhum (manter offline e simples)?

**Resposta**: _[Preencha aqui]_

---

### 5. Persistência de Dados
**Pergunta**: Os prontuários preenchidos devem ser salvos no localStorage para que o aluno possa voltar e revisar? Ou cada sessão começa do zero?

**Resposta**: _[Preencha aqui]_

---

### 6. Sistema de Classificação de Diagnósticos
**Pergunta**: Para os diagnósticos de enfermagem, devo usar uma lista baseada na NANDA-I simplificada (diagnósticos mais comuns em enfermagem técnica) ou uma lista livre onde o aluno digita?

**Resposta**: _[Preencha aqui]_

---

### 7. Nível do Aluno
**Pergunta**: Este simulador é focado em alunos de qual período? Isso influencia a complexidade dos campos:
- Início do curso (campos mais simples, mais guia)
- Final do curso / estágio (campos completos como na prática real)

**Resposta**: _[Preencha aqui]_

---

## 💉 Simulador de Bomba de Infusão

### 8. Velocidade da Simulação
**Pergunta**: A simulação em tempo real deve rodar em velocidade acelerada? Sugiro que 1 hora simulada = 30 segundos reais (ou seja, uma infusão de 8h seria concluída em ~4 minutos). Qual proporção prefere?

**Resposta**: _[Preencha aqui]_

---

### 9. Sons de Alarme
**Pergunta**: Devo incluir sons (beeps) para os alarmes ou apenas indicações visuais? (Sons podem ser disruptivos em sala de aula)

**Resposta**: _[Preencha aqui]_

---

### 10. Exercícios Guiados
**Pergunta**: Devo incluir exercícios tipo "quiz prático" dentro do simulador? Ex:  
_"Médico prescreveu 1000 mL de SF 0.9% em 8 horas. Configure a bomba volumétrica com os parâmetros corretos."_  
O sistema validaria se a vazão programada pelo aluno está correta (125 mL/h).

**Resposta**: _[Preencha aqui]_

---

### 11. Tipos de Bomba
**Pergunta**: Confirma os 3 tipos propostos?
- ✅ Bomba Volumétrica (equipo)
- ✅ Bomba de Seringa
- ✅ Bomba PCA (analgesia pelo paciente)

Ou deseja adicionar/remover algum tipo?

**Resposta**: _[Preencha aqui]_

---

### 12. Medicamentos de Exemplo
**Pergunta**: Para os exercícios, devo usar nomes de medicamentos genéricos (sem marcas) como Cloreto de Sódio 0.9%, Dipirona, Morfina, Noradrenalina? Alguma lista de fármacos que deseja incluir?

**Resposta**: _[Preencha aqui]_

---

## ⚙️ Questões Gerais

### 13. Gamificação
**Pergunta**: Os XP devem ser concedidos para:
- Preenchimento completo do PEP: +20 XP?
- Completar exercício na bomba: +15 XP?
- Acertar resposta em validação: +10 XP?

**Resposta**: _[Preencha aqui ou ajuste os valores]_

---

### 14. Mobile vs Desktop
**Pergunta**: O simulador de bomba pode ficar complexo em telas pequenas. Devo:
- (a) Manter funcionalidade completa com scroll
- (b) Simplificar interface em mobile
- (c) Bloquear uso em tela < 768px com aviso "Use em tablet ou desktop"

**Resposta**: _[Preencha aqui]_

---

### 15. Idioma dos Termos Técnicos
**Pergunta**: Termos como "VTBI", "KVO", "PRIME", "BOLUS" devem aparecer:
- (a) Em inglês com tradução ao lado (como em equipamentos reais)
- (b) Traduzidos para português apenas
- (c) Inglês com tooltip explicativo

**Resposta**: _[Preencha aqui]_

---

### 16. Acessibilidade
**Pergunta**: Há alunos com necessidades especiais que devam ser consideradas? (ex: daltonismo — evitar depender apenas de cores para feedback)

**Resposta**: _[Preencha aqui]_

---

### 17. Frequência de Atualização
**Pergunta**: Com que frequência deseja revisar o conteúdo normativo? O sistema terá campo de versão e data. Sugiro revisão semestral alinhada ao calendário escolar.

**Resposta**: _[Preencha aqui]_

---

> **Nota**: Estas perguntas não são bloqueantes. Posso implementar com valores padrão e ajustar depois. Porém, as respostas melhoram significativamente a qualidade final do produto.
