let username='', currentCluster='', currentSubject='', currentLevel='';
let currentQuestions=[], currentIndex=0, answered=false;
let answeredQuestions=[];

let profileStats={
  1:{ "Забони точики":{correct:0,wrong:0}, "Математика":{correct:0,wrong:0}, "Химия":{correct:0,wrong:0}, "Физика":{correct:0,wrong:0} },
  2:{ "Забони точики":{correct:0,wrong:0}, "Математика":{correct:0,wrong:0}, "География":{correct:0,wrong:0}, "Забони англиси":{correct:0,wrong:0} },
  3:{ "Забони точики":{correct:0,wrong:0}, "Таърих":{correct:0,wrong:0}, "Адабиёти точик":{correct:0,wrong:0}, "Забони англиси":{correct:0,wrong:0} },
  4:{ "Забони точики":{correct:0,wrong:0}, "Таърих":{correct:0,wrong:0}, "Хукук":{correct:0,wrong:0}, "Забони англиси":{correct:0,wrong:0} },
  5:{ "Забони точики":{correct:0,wrong:0}, "Биология":{correct:0,wrong:0}, "Химия":{correct:0,wrong:0}, "Физика":{correct:0,wrong:0} }
};

// Ввод имени
document.getElementById('start-btn').addEventListener('click',()=>{
  const input=document.getElementById('username-input').value.trim();
  if(input){ username=input; updateUsername(username); showScreen('cluster-screen'); }
  else alert("Лутфан номи худро ворид кунед!");
});

// Выбор кластера
document.querySelectorAll('.cluster-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    currentCluster=btn.dataset.cluster;
    document.getElementById('cluster-number').textContent=currentCluster;
    const subjects=questions[currentCluster];
    const container=document.getElementById('subject-buttons');
    container.innerHTML='';
    for(let subj in subjects){
      const b=document.createElement('button');
      b.textContent=subj; b.dataset.subject=subj; container.appendChild(b);
    }
    showScreen('subject-screen');
  });
});

// Выбор предмета
document.getElementById('subject-buttons').addEventListener('click',(e)=>{
  if(e.target.tagName==='BUTTON'){ currentSubject=e.target.dataset.subject; showScreen('level-screen'); }
});

// Выбор уровня
document.querySelectorAll('.level-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    currentLevel=btn.dataset.level;
    currentQuestions=[...questions[currentCluster][currentSubject][currentLevel]];
    currentIndex=0; answered=false;
    showNextQuestion();
    showScreen('question-screen');
  });
});

// Показ следующего вопроса
function showNextQuestion(){
  if(currentIndex>=currentQuestions.length){
    showScreen('profile-screen');
    showProfile(profileStats);
    return;
  }
  answered=false;
  const q=currentQuestions[currentIndex];
  updateScoreBar(profileStats[currentCluster][currentSubject].correct,
                 profileStats[currentCluster][currentSubject].wrong,
                 currentQuestions.length,
                 currentIndex+1);
  showQuestion(currentIndex+1,q.question,q.answers);
  document.querySelectorAll('#answer-buttons button').forEach(btn=>{
    btn.onclick=()=>handleAnswer(btn,q.correct);
  });
}

// Обработка ответа
function handleAnswer(button,correctIndex){
  if(answered) return;
  answered=true;
  const idx=parseInt(button.dataset.index);
  if(idx===correctIndex){ 
    button.classList.add('correct'); 
    profileStats[currentCluster][currentSubject].correct+=1; 
  } else { 
    button.classList.add('wrong'); 
    document.querySelectorAll('#answer-buttons button')[correctIndex].classList.add('correct'); 
    profileStats[currentCluster][currentSubject].wrong+=1; 
  }

  answeredQuestions.push(currentIndex);

  updateScoreBar(profileStats[currentCluster][currentSubject].correct,
                 profileStats[currentCluster][currentSubject].wrong,
                 currentQuestions.length,
                 currentIndex+1);

  setTimeout(()=>{ currentIndex++; showNextQuestion(); },2000);
}

// Закончить предмет
document.getElementById('finish-subject-btn').addEventListener('click',()=>{
  showScreen('profile-screen');
  showProfile(profileStats);
});

// Профиль сверху
document.getElementById('profile-btn').addEventListener('click',()=>{
  showScreen('profile-screen');
  showProfile(profileStats);
});

// Профиль кнопки
document.getElementById('back-to-menu-btn').addEventListener('click',()=>{
  showScreen('cluster-screen');
});

// Кнопки "Назад"
document.querySelectorAll('.back-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const targetScreen = btn.dataset.back;
    showScreen(targetScreen);
  });
});

// Сброс прогресса с подтверждением
document.getElementById('reset-progress-btn').addEventListener('click',()=>{
  if(confirm("Хотите сделать обновление процесса?")){
    for(let c in profileStats){
      for(let s in profileStats[c]){
        profileStats[c][s].correct = 0;
        profileStats[c][s].wrong = 0;
      }
    }
    answeredQuestions = [];
    currentIndex = 0;
    answered = false;
    currentQuestions = [];
    updateScoreBar(0,0,0,0);
    showScreen('cluster-screen');
  }
});