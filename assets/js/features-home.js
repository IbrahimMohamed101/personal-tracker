// Home dashboard, day types, and minimum viable day logic.
function setDayType(btn,type){
  S.dayType=type;
  document.querySelectorAll('.dt-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  renderMVD();
  save();
}

function renderMVD(){
  const tasks=MVD_LISTS[S.dayType]||MVD_LISTS.normal;
  const dk=todayKey();
  const key='mvd_'+S.dayType+'_'+dk;
  if(!S.mvdDone)S.mvdDone={};
  const done=S.mvdDone[key]||[];
  const container=document.getElementById('mvd-tasks');
  const lbl=document.getElementById('mvd-day-lbl');
  if(lbl)lbl.textContent=MVD_LABELS[S.dayType]||'';
  if(container)container.innerHTML=tasks.map((task,index)=>`<label class="cockpit-task mvd-task ${done.includes(index)?'done':''}" data-task-index="${index}"><input type="checkbox" ${done.includes(index)?'checked':''} onchange="toggleMVD(${index},'${key}',this)"><span class="cockpit-task-switch" aria-hidden="true"><span class="cockpit-task-thumb"></span></span><span class="cockpit-task-copy"><span class="cockpit-task-kicker">Directive ${toAr(index+1)}</span><span class="cockpit-task-text text">${escapeHtml(task)}</span></span><span class="cockpit-task-halo" aria-hidden="true"></span></label>`).join('');
  const doneCount=done.length;
  const pct=Math.round(doneCount/tasks.length*100);
  const doneCountEl=document.getElementById('mvd-done-count');
  const donePctEl=document.getElementById('mvd-done-pct');
  const bar=document.getElementById('mvd-bar');
  if(doneCountEl)doneCountEl.textContent=toAr(doneCount)+' من '+toAr(tasks.length);
  if(donePctEl)donePctEl.textContent=toAr(pct)+'٪';
  if(bar)bar.style.width=pct+'%';
}

function toggleMVD(idx,key,el){
  if(!S.mvdDone)S.mvdDone={};
  if(!S.mvdDone[key])S.mvdDone[key]=[];
  const arr=S.mvdDone[key];
  const wasChecked=arr.includes(idx);
  if(el.checked){
    if(!arr.includes(idx))arr.push(idx);
  }else{
    const index=arr.indexOf(idx);
    if(index>-1)arr.splice(index,1);
  }
  if(!wasChecked&&el.checked)grantXp(10);
  renderMVD();
  renderAchievements();
  window.dispatchEvent(new CustomEvent('dashboard:mvd-toggle',{detail:{index:idx,key,checked:Boolean(el.checked)}}));
  save();
}

function renderHome(){
  renderMVD();
  renderStats();
  updateLifeCards();
  document.querySelectorAll('.dt-btn').forEach(btn=>btn.classList.toggle('active',btn.getAttribute('data-type')===S.dayType));
  if(typeof window.dashboardCockpitInit==='function')window.dashboardCockpitInit();
}

function renderStats(){
  const maxStreak=S.habits.reduce((max,habit)=>Math.max(max,calcMaxStreak(habit.done)),0);
  const streakEl=document.getElementById('stat-streak');
  if(streakEl)streakEl.textContent=toAr(maxStreak);

  const savings=S.expenses.filter(expense=>expense.cat==='ادخار').reduce((sum,expense)=>sum+expense.amt,0);
  const savingsEl=document.getElementById('stat-savings');
  if(savingsEl)savingsEl.textContent=toArFull(savings);
  const savingsLabelEl=document.getElementById('stat-savings-label');
  if(savingsLabelEl)savingsLabelEl.textContent=currencyShortName();

  const dk=todayKey();
  const todayHabits=S.habits.filter(habit=>habit.done.includes(dk)).length;
  const pct=S.habits.length?Math.round(todayHabits/S.habits.length*100):0;
  const habitsEl=document.getElementById('stat-habits');
  if(habitsEl)habitsEl.textContent=toAr(pct)+'٪';

  const solved=S.problems.filter(problem=>problem.status==='done').length;
  const solvedEl=document.getElementById('stat-solved');
  if(solvedEl)solvedEl.textContent=toAr(solved);
}

function updateLifeCards(){
  const dk=todayKey();
  const habitMap={};
  S.habits.forEach(habit=>{habitMap[habit.id]=habit.done.includes(dk);});
  function setLc(id,cls,text){
    const el=document.getElementById('lc-'+id);
    if(el){
      el.className='lc-status '+cls;
      el.textContent=text;
    }
  }
  setLc('sleep',habitMap.sleep?'lc-ok':'lc-warn',habitMap.sleep?'✓ منتظم':'غير منتظم');
  setLc('study',habitMap.study?'lc-ok':'lc-warn',habitMap.study?'✓ ذاكرتِ':'ضعيفة');
  setLc('spirit',habitMap.quran?'lc-ok':'lc-warn',habitMap.quran?'✓ ورد':'في النص');
  setLc('dev',habitMap.english?'lc-ok':'lc-neutral',habitMap.english?'✓ إنجليزي':'لسه');
  const hasExpenseToday=S.expenses.some(expense=>expense.date===dk);
  setLc('money',hasExpenseToday||habitMap.money_log?'lc-ok':'lc-neutral',hasExpenseToday?'✓ مسجّل':'ابدأي');
  const todayTasks=(S.tasks||[]).filter(task=>task.date===dk);
  const completedTasks=todayTasks.filter(task=>task.done).length;
  setLc('tasks',completedTasks? 'lc-ok':'lc-neutral',completedTasks?`✓ ${toAr(completedTasks)} منجزة`:'رتبيها');
  const hasJournal=(S.journal||[]).some(entry=>entry.date===dk);
  setLc('journal',hasJournal?'lc-ok':'lc-warn',hasJournal?'✓ كُتبت':'لم تُكتب');
}
