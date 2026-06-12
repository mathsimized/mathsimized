const SAT_ENGLISH_QUESTIONS = {
  quick_test: [
    {
      id: "eqt_q1",
      type: "multiple_choice",
      domain: "Information and Ideas",
      difficulty: "medium",
      stimulus: "The following passage is adapted from a speech delivered by a prominent scientist at a national conference:\n\n\"We stand at a crossroads in our history. The decisions we make today about energy policy will reverberate through generations. Every watt of power we generate leaves a footprint on our planet. The question is not whether we can afford to change our energy infrastructure—it is whether we can afford not to. The cost of inaction far exceeds the investment required for transformation.\"",
      question: "The speaker's primary purpose in the passage is to:",
      choices: { A: "Describe the technical challenges of changing energy infrastructure", B: "Argue that the cost of inaction on energy policy is too high", C: "Explain how energy policy has changed over recent generations", D: "Criticize those who oppose investment in new technology" },
      correct_answer: "B",
      explanation: "The speaker emphasizes that the cost of inaction exceeds the investment needed, making a clear argument for change."
    },
    {
      id: "eqt_q2",
      type: "multiple_choice",
      domain: "Craft and Structure",
      difficulty: "medium",
      stimulus: "The artist's latest work has been described as \"audacious\" by some critics and \"reckless\" by others. This division in opinion seems to stem less from the technical quality of the work and more from its willingness to challenge conventional aesthetic norms. As one reviewer noted, the piece \"does not merely push boundaries—it redraws them entirely, leaving the viewer to navigate an unfamiliar landscape of form and meaning.\"",
      question: "As used in the passage, \"audacious\" most nearly means:",
      choices: { A: "Bold", B: "Foolish", C: "Quiet", D: "Traditional" },
      correct_answer: "A",
      explanation: "\"Audacious\" in this context means bold or daring, as contrasted with \"reckless\" and described as challenging conventions."
    },
    {
      id: "eqt_q3",
      type: "multiple_choice",
      domain: "Standard English Conventions",
      difficulty: "medium",
      stimulus: "",
      question: "The committee members concluded that the new policy, despite its initial costs, would ultimately benefit the community _______ they remained cautious about the implementation timeline.",
      choices: { A: "but", B: "because", C: "so", D: "unless" },
      correct_answer: "A",
      explanation: "The word \"but\" correctly shows the contrast between the policy benefiting the community and the committee's caution about implementation."
    },
    {
      id: "eqt_q4",
      type: "multiple_choice",
      domain: "Expression of Ideas",
      difficulty: "medium",
      stimulus: "The museum's new exhibit explores the relationship between technology and art in the twenty-first century. It features works by twelve international artists. Each artist was asked to create a piece that responds to a specific technological innovation.",
      question: "Which choice best combines the sentences at the underlined portion?",
      choices: { A: "century, it features", B: "century and features", C: "century, featuring", D: "century, which features" },
      correct_answer: "C",
      explanation: "\"Century, featuring\" creates a concise and grammatically correct participial phrase that connects the two ideas."
    },
    {
      id: "eqt_q5",
      type: "multiple_choice",
      domain: "Information and Ideas",
      difficulty: "hard",
      stimulus: "Recent studies in behavioral economics have challenged the traditional assumption that consumers make rational decisions based on complete information. Instead, researchers have identified numerous cognitive biases that systematically influence choice. One such bias, the anchoring effect, occurs when individuals rely too heavily on an initial piece of information—the \"anchor\"—when making subsequent judgments. For example, if a car is initially priced at $35,000 and then discounted to $28,000, consumers perceive the final price as a bargain, even if $28,000 exceeds the car's market value.",
      question: "Which of the following best describes the function of the example in the passage?",
      choices: { A: "It introduces a counterargument to the main claim", B: "It illustrates the anchoring effect described earlier", C: "It provides evidence that consumers are always rational", D: "It compares behavioral economics to traditional economics" },
      correct_answer: "B",
      explanation: "The car pricing example directly demonstrates the anchoring effect, showing how an initial anchor price influences perception of subsequent prices."
    },
    {
      id: "eqt_q6",
      type: "multiple_choice",
      domain: "Craft and Structure",
      difficulty: "hard",
      stimulus: "The historian argued that the conventional narrative of the Industrial Revolution overlooks the contributions of marginalized communities. \"To tell the story of industry without acknowledging the labor and innovation of those who built it is not merely incomplete—it is a distortion,\" she wrote. Her research recovers the names and stories of inventors, engineers, and workers whose roles had been systematically erased from the historical record.",
      question: "The phrase \"a distortion\" primarily serves to:",
      choices: { A: "Suggest that the historian's own work may be biased", B: "Emphasize that omitting certain perspectives fundamentally misrepresents history", C: "Indicate that the Industrial Revolution had both positive and negative effects", D: "Question whether a complete historical account is even possible" },
      correct_answer: "B",
      explanation: "\"A distortion\" implies that the incomplete narrative actively misrepresents history, going beyond mere incompleteness to actual misrepresentation."
    },
    {
      id: "eqt_q7",
      type: "multiple_choice",
      domain: "Standard English Conventions",
      difficulty: "medium",
      stimulus: "",
      question: "The expedition team spent three months preparing for the journey, _______ equipment, studying maps, and practicing survival skills.",
      choices: { A: "they gathered", B: "gathering", C: "gathered", D: "and gathering" },
      correct_answer: "B",
      explanation: "\"Gathering\" maintains parallel structure with \"studying\" and \"practicing\" in the series of preparatory activities."
    },
    {
      id: "eqt_q8",
      type: "multiple_choice",
      domain: "Expression of Ideas",
      difficulty: "hard",
      stimulus: "The urban garden project succeeded beyond expectations. It transformed a vacant lot into a thriving community space. It provided fresh produce to over 200 families. It created jobs for local residents. It became a model for similar initiatives across the city.",
      question: "Which choice best combines the information in the passage into a single sentence?",
      choices: { A: "The urban garden project succeeded beyond expectations, and it transformed a vacant lot and provided fresh produce and created jobs and became a model", B: "By transforming a vacant lot into a thriving community space, the urban garden project succeeded beyond expectations, providing fresh produce to over 200 families, creating jobs for local residents, and becoming a model for similar initiatives across the city", C: "The urban garden project, transforming a vacant lot and providing fresh produce and creating jobs, became a model for similar initiatives, succeeding beyond expectations", D: "Succeeding beyond expectations, the urban garden project transformed a vacant lot, provided fresh produce, created jobs, and became a model for similar initiatives" },
      correct_answer: "B",
      explanation: "Option B logically structures the sentence with the transformation as the means, the success as the main clause, and the outcomes as parallel participial phrases."
    },
    {
      id: "eqt_q9",
      type: "multiple_choice",
      domain: "Information and Ideas",
      difficulty: "medium",
      stimulus: "A study of 500 participants examined the relationship between sleep duration and cognitive performance. Participants were divided into three groups: those who slept less than 6 hours, those who slept 6-8 hours, and those who slept more than 8 hours per night. The results showed that the 6-8 hour group performed significantly better on memory recall and problem-solving tasks than either of the other groups.",
      question: "Which of the following claims is best supported by the information in the passage?",
      choices: { A: "Sleeping more than 8 hours improves cognitive performance", B: "Moderate sleep duration is associated with better cognitive performance than very short or very long sleep", C: "All participants performed equally well on cognitive tasks", D: "Sleep duration has no effect on problem-solving abilities" },
      correct_answer: "B",
      explanation: "The study explicitly shows that the 6-8 hour group outperformed both shorter and longer sleep groups on cognitive tasks."
    },
    {
      id: "eqt_q10",
      type: "multiple_choice",
      domain: "Craft and Structure",
      difficulty: "hard",
      stimulus: "The author's tone throughout the essay can best be described as measured yet urgent. She presents statistical evidence with clinical precision, but her word choices—\"crisis,\" \"tipping point,\" \"unprecedented\"—reveal an underlying alarm. This deliberate tension between form and content creates a rhetorical effect that is both intellectually credible and emotionally compelling.",
      question: "The author characterizes the essay's tone as \"measured yet urgent\" primarily to:",
      choices: { A: "Suggest that the essay is both objective and persuasive", B: "Indicate that the author is conflicted about her subject", C: "Contrast the essay's style with its emotional impact", D: "Question whether the essay's evidence supports its claims" },
      correct_answer: "A",
      explanation: "\"Measured\" implies careful, objective presentation, while \"urgent\" implies a need for action, combining credibility with persuasiveness."
    }
  ]
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = SAT_ENGLISH_QUESTIONS;
}
