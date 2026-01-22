const questions = [
  { question: "Дар кадом калимаҳо ба ҷойи ӯ ҳарфи у навишта шудааст?", correct: "куҳ, обруй" },
  { question: "Кадом калимаҳо бо ҳарфи ӯ навишта мешаванд?", correct: "олу, оҳу" },
  { question: "Кадом калимаҳо бо ҳарфи ӯ навишта мешаванд?", correct: "воҳурӣ, гуё" },
  { question: "Садоноки ӯ дар кадом калимаҳо дуруст навишта шудааст?", correct: "рӯз, гӯш" },
  { question: "Кадом калимаҳо бо ҳарфи ӯ навишта мешаванд?", correct: "афсус, андуз" },
  { question: "Садоноки ӯ дар кадом калимаҳо дуруст навишта шудааст?", correct: "абрӯ, бозӯ" },
  { question: "Дар ибораҳои додашуда кадом калима бо ҳарфи у навишта мешавад, на бо ӯ?", correct: "хомӯшии бардавом" },
  { question: "Дар ибораҳои додашуда кадом калима бо ҳарфи у навишта мешавад, на бо ӯ?", correct: "бонги хурӯс" },
  { question: "Дар ибораҳои додашуда кадом калима бо ҳарфи у навишта мешавад, на бо ӯ?", correct: "гуфтугӯи мардона" },
  { question: "Дар кадом калима имлои ҳарфи ӯ нодуруст аст?", correct: "булӯр" },
  { question: "Дар кадом калима имлои ҳарфи ӯ нодуруст аст?", correct: "зӯран" },
  { question: "Дар кадом калима имлои ҳарфи ӯ нодуруст аст?", correct: "мурӯд" },
  { question: "Дар кадом калима имлои ҳарфи ӯ нодуруст аст?", correct: "бӯҳтон" },
  { question: "Дар кадом калима имлои ҳарфи ӯ нодуруст аст?", correct: "гӯшмол" },
  { question: "Дар ибораҳои додашуда кадом калима бо ҳарфи у навишта мешавад, на бо ӯ?", correct: "рӯзии пурнишот" },
  { question: "Дар ибораҳои додашуда кадом калима бо ҳарфи у навишта мешавад, на бо ӯ?", correct: "обрӯйи инсон" },
  { question: "Дар ибораҳои додашуда кадом калима бо ҳарфи у навишта мешавад, на бо ӯ?", correct: "шӯълаи чароғ" },
  { question: "Дар мақоли зерин дар калимаи хомӯшӣ ҳарфи ӣ чӣ вазифа дорад:", correct: "пасванди исмсоз" }
];

let index = 0;
let answersGiven = [];

function getWrongAnswers(correct) {
  const wrong = [
    "муъмин, муътабар", "муҳра, муҳсин", "буҳрон, буҳтон",
    "муъҷизаи табиат", "калимаи дигар", "хӯшаи ангур",
    "марди кӯҳансол", "фурӯғи дониш", "фурӯғи илм",
    "шӯхи беқарор", "занбӯри асал", "бонги хурӯс"
  ];
  return wrong.filter(a => a !== correct).sort(() => 0.5 - Math.random()).slice(0, 2);
}

function getAllAnswers(correct) {
  let answers = [correct, ...getWrongAnswers(correct)];
  return answers.sort(() => 0.5 - Math.random());
}

function showQuestion() {
  if (index >= questions.length) return showReport();

  const q = questions[index];
  const answers = getAllAnswers(q.correct);
  document.getElementById("question").innerText = `${index + 1}. ${q.question}`;
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";

  answers.forEach(answer => {
    const btn = document.createElement("button");
    btn.innerText = answer;
    btn.onclick = () => {
      if (!answersGiven[index]) answersGiven[index] = answer;

      if (answer === q.correct) btn.classList.add("correct");
      else btn.classList.add("wrong");

      // Подсветка правильного
      const allButtons = document.querySelectorAll("#answers button");
      allButtons.forEach(b => { if (b.innerText === q.correct) b.classList.add("correct"); });

      // Блокируем кнопки
      allButtons.forEach(b => b.disabled = true);

      // Через 2 секунды переходим к следующему вопросу
      setTimeout(() => {
        index++;
        showQuestion();
      }, 2000);
    };
    answersDiv.appendChild(btn);
  });
}

function showReport() {
  let score = 0;
  let report = "<h2>Ҳисоби натиҷаҳо:</h2><ul>";
  questions.forEach((q, i) => {
    const your = answersGiven[i] || "Не интихоб карда шуд";
    const correct = q.correct;
    if (your === correct) score++;
    report += `<li>${i + 1}. Савол: ${q.question}<br>Ҷавоби шумо: ${your} — <strong>${your === correct ? "Дуруст ✅" : "Нодуруст ❌"}</strong><br>Ҷавоби дуруст: ${correct}</li><br>`;
  });
  report += `</ul><h3>Ҳисоби умумӣ: ${score} аз ${questions.length}</h3>`;
  document.body.innerHTML = report;
}

// Показ первого вопроса
showQuestion();