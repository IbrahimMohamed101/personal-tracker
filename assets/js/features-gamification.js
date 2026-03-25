// XP, levels, weekly challenge, and achievements.
function showXpToast(amount){
  const el=document.getElementById('xp-toast');
  if(!el)return;
  el.textContent=`✦ +${toAr(amount)} XP`;
  el.classList.remove('show');
  window.requestAnimationFrame(()=>{
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),1500);
  });
}

function syncLevelFromXp(){
  S.level=computeLevel(S.xp);
}

function getWeekChallengeRecord(){
  if(!S.weeklyChallenge)return null;
  try{
    return typeof S.weeklyChallenge==='string'?JSON.parse(S.weeklyChallenge):S.weeklyChallenge;
  }catch(_err){
    return null;
  }
}

function setWeekChallengeRecord(record){
  S.weeklyChallenge=record?JSON.stringify(record):null;
}

function getChallengeDefinition(id){
  return WEEKLY_CHALLENGE_DEFS.find(item=>item.id===id)||null;
}

function ensureWeeklyChallenge(){
  const today=parseDateKey(todayKey());
  const isSaturday=today.getDay()===6;
  const weekStart=challengeWeekStartKey(todayKey());
  const current=getWeekChallengeRecord();
  if(current&&current.week===weekStart)return;
  const index=(today.getFullYear()+today.getMonth()+today.getDate())%WEEKLY_CHALLENGE_DEFS.length;
  const def=WEEKLY_CHALLENGE_DEFS[index];
  const record={
    id:def.id,
    week:weekStart,
    text:def.text,
    reward:def.reward,
    target:def.target,
    type:def.type,
    generatedOn:isSaturday?todayKey():todayKey(),
  };
  setWeekChallengeRecord(record);
  S.weeklyChallengeDone=false;
  S.weeklyChallengeProgress=0;
}

function updateWeeklyChallengeProgress(){
  const record=getWeekChallengeRecord();
  if(!record){
    S.weeklyChallengeProgress=0;
    return;
  }
  const def=getChallengeDefinition(record.id);
  if(!def){
    S.weeklyChallengeProgress=0;
    return;
  }
  const progress=Number(def.progress()||0);
  S.weeklyChallengeProgress=progress;
  if(!S.weeklyChallengeDone&&progress>=record.target){
    S.weeklyChallengeDone=true;
    grantXp(record.reward,{silent:false,skipChallengeCheck:true});
    toast(`🏆 ${record.text}`);
  }
}

function grantXp(amount,options={}){
  const safeAmount=Math.max(0,Math.round(Number(amount)||0));
  if(!safeAmount)return;
  S.xp=Math.max(0,Math.round(Number(S.xp)||0)+safeAmount);
  syncLevelFromXp();
  if(!options.silent)showXpToast(safeAmount);
  if(!options.skipChallengeCheck)updateWeeklyChallengeProgress();
  renderXpUi();
}

function getCompletedTaskCount(){
  return (S.tasks||[]).filter(task=>task.done).length;
}

function getMaxHabitStreak(){
  return (S.habits||[]).reduce((max,habit)=>Math.max(max,calcMaxStreak(habit.done)),0);
}

function getSavingsTotal(){
  return (S.expenses||[]).filter(expense=>expense.cat==='ادخار').reduce((sum,expense)=>sum+expense.amt,0);
}

function getActivityDates(){
  const dates=new Set();
  (S.habits||[]).forEach(habit=>habit.done.forEach(date=>dates.add(date)));
  (S.expenses||[]).forEach(expense=>dates.add(expense.date));
  (S.journal||[]).forEach(entry=>dates.add(entry.date));
  (S.tasks||[]).filter(task=>task.done).forEach(task=>dates.add(task.date));
  return [...dates].sort();
}

function getAchievementUnlocks(){
  const maxStreak=getMaxHabitStreak();
  const savings=getSavingsTotal();
  const activityCount=getActivityDates().length;
  const badges={
    first_habit:(S.habits||[]).some(habit=>habit.done.length>0),
    streak_7:maxStreak>=7,
    streak_30:maxStreak>=30,
    first_saving:(S.expenses||[]).some(expense=>expense.cat==='ادخار'),
    saved_1000:savings>=1000,
    first_problem_done:(S.problems||[]).some(problem=>problem.status==='done'),
    weekly_review:(S.weeklyHistory||[]).length>0,
    tasks_10:getCompletedTaskCount()>=10,
    level_5:(S.level||1)>=5,
    level_10:(S.level||1)>=10,
    thirty_day_active:activityCount>=30,
    productivity_master:false,
  };
  const unlockedCount=Object.values(badges).filter(Boolean).length;
  badges.productivity_master=unlockedCount>=8;
  return badges;
}

function renderXpUi(){
  syncLevelFromXp();
  ensureWeeklyChallenge();
  updateWeeklyChallengeProgress();
  const levelData=xpIntoLevel(S.xp);
  const record=getWeekChallengeRecord();
  const miniChallenge=record?record.text:'لا يوجد تحدي أسبوعي بعد';
  const levelTitle=`المستوى ${toAr(S.level)} ✦`;
  const miniText=S.level>=20?`${toAr(S.xp)} XP`:`${toAr(levelData.current)} / ${toAr(levelData.target)}`;
  const setText=(id,value)=>{
    const el=document.getElementById(id);
    if(el)el.textContent=value;
  };
  setText('xp-level-title',levelTitle);
  setText('xp-level-mini',miniText);
  setText('xp-challenge-mini',miniChallenge);
  setText('m-xp-level',levelTitle);
  setText('m-xp-mini',miniText);
  const bars=['xp-bar','m-xp-bar'];
  bars.forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.width=`${levelData.progress}%`;
  });
}

function renderAchievements(){
  const container=document.getElementById('achievements-list');
  if(!container)return;
  const unlocks=getAchievementUnlocks();
  const levelData=xpIntoLevel(S.xp);
  const record=getWeekChallengeRecord();
  const nextValue=S.level>=20?0:levelData.target-levelData.current;
  const challengePct=record?Math.min(100,Math.round((S.weeklyChallengeProgress/record.target)*100)):0;
  const setText=(id,value)=>{
    const el=document.getElementById(id);
    if(el)el.textContent=value;
  };
  setText('achievement-level',toAr(S.level));
  setText('achievement-xp',toAr(S.xp));
  setText('achievement-next',S.level>=20?'—':toAr(nextValue));
  const xpBar=document.getElementById('achievement-xp-bar');
  if(xpBar)xpBar.style.width=`${levelData.progress}%`;
  setText('weekly-challenge-title',record?record.text:'لا يوجد تحدي بعد');
  setText('weekly-challenge-meta',record?`${toAr(Math.min(S.weeklyChallengeProgress,record.target))} / ${toAr(record.target)}${S.weeklyChallengeDone?' • مكتمل ✓':''}`:'انتظري التحدي القادم');
  const challengeBar=document.getElementById('weekly-challenge-bar');
  if(challengeBar)challengeBar.style.width=`${challengePct}%`;
  container.innerHTML=ACHIEVEMENT_DEFS.map(item=>{
    const unlocked=Boolean(unlocks[item.id]);
    return `<div class="badge-card ${unlocked?'':'locked'}" id="badge-${item.id}"><div class="badge-icon">${item.icon}</div><div class="badge-title">${escapeHtml(item.title)}</div><div class="badge-desc">${escapeHtml(item.desc)}</div><div class="badge-state" style="color:${unlocked?'var(--green)':'var(--text3)'}">${unlocked?'مفتوح ✓':'مغلق'}</div></div>`;
  }).join('');
  
  // Particle burst for newly unlocked
  if (window.SAMA_LAST_UNLOCKS) {
    ACHIEVEMENT_DEFS.forEach(item => {
      if (unlocks[item.id] && !window.SAMA_LAST_UNLOCKS[item.id]) {
        const badgeEl = document.getElementById(`badge-${item.id}`);
        if (badgeEl) {
          badgeEl.classList.add('unlocked', 'stagger-item');
          setTimeout(() => { if(window.particleBurst) window.particleBurst(badgeEl); }, 300);
        }
      }
    });
  }
  window.SAMA_LAST_UNLOCKS = unlocks;
}
