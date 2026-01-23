function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function updateUsername(name){ document.getElementById('profile-username').textContent=name; }
function showQuestion(qNumber,qText,answers){
  document.getElementById('question-number').textContent=`Вопрос ${qNumber}`;
  document.getElementById('question-text').textContent=qText;
  const btnContainer=document.getElementById('answer-buttons');
  btnContainer.innerHTML='';
  answers.forEach((ans,index)=>{
    const btn=document.createElement('button');
    btn.textContent=ans;
    btn.dataset.index=index;
    btn.classList.remove('correct','wrong');
    btnContainer.appendChild(btn);
  });
}
function showProfile(stats){
  const container=document.getElementById('profile-stats');
  container.innerHTML='';
  for(let cluster in stats){
    container.innerHTML+=`<h3>Кластер ${cluster}</h3>`;
    for(let subj in stats[cluster]){
      container.innerHTML+=`<p>${subj}: ✅ ${stats[cluster][subj].correct} | ❌ ${stats[cluster][subj].wrong}</p>`;
    }
  }
}
function updateScoreBar(correct,wrong,total,current){
  document.getElementById('correct-count').textContent=correct;
  document.getElementById('wrong-count').textContent=wrong;
  document.getElementById('question-index').textContent=current;
  document.getElementById('total-questions').textContent=total;
}