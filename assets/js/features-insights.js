// Mood, analytics, pomodoro, and tips.
function moodMeta(value){
  return MOOD_OPTIONS.find(option=>option.value===value)||MOOD_OPTIONS[2];
}

function renderMood(){
  const options=document.getElementById('mood-options');
  const history=document.getElementById('mood-history');
  if(!options||!history)return;
  const todayEntry=(S.moodLog||[]).find(entry=>entry.date===todayKey())||null;
  if(selectedMood===null)selectedMood=todayEntry?todayEntry.mood:3;
  options.innerHTML=MOOD_OPTIONS.map(option=>`<button type="button" class="mood-btn ${selectedMood===option.value?'active':''}" onclick="selectMood(${option.value})"><span class="mood-emoji">${option.emoji}</span><span class="mood-name">${escapeHtml(option.label)}</span></button>`).join('');
  const noteEl=document.getElementById('mood-note');
  if(noteEl)noteEl.value=todayEntry?todayEntry.note:'';
  history.innerHTML=(S.moodLog||[]).length?(S.moodLog||[]).slice(0,14).map(entry=>{
    const meta=moodMeta(entry.mood);
    return `<div class="mood-item"><div class="mood-item-top"><div style="display:flex;align-items:center;gap:10px"><span class="mood-emoji">${meta.emoji}</span><div><div style="font-size:13px;color:var(--text0)">${escapeHtml(meta.label)}</div><div style="font-size:11px;color:var(--text3)">${escapeHtml(entry.date)}</div></div></div><button class="mini-action danger" onclick="deleteMood(${entry.id})">حذف</button></div>${entry.note?`<div style="font-size:13px;color:var(--text2)">${escapeHtml(entry.note)}</div>`:''}</div>`;
  }).join(''):'<div class="exp-empty">لا يوجد سجل مزاج بعد</div>';
}

function selectMood(value){
  selectedMood=value;
  renderMood();
}

function saveMood(){
  const note=(document.getElementById('mood-note')||{}).value?.trim()||'';
  const today=todayKey();
  const existing=(S.moodLog||[]).find(item=>item.date===today);
  if(existing){
    existing.mood=selectedMood||3;
    existing.note=note;
  }else{
    S.moodLog.unshift({id:generateNumericId(),date:today,mood:selectedMood||3,note,createdAt:new Date().toISOString()});
  }
  renderMood();
  save();
  toast('تم حفظ المزاج');
}

function deleteMood(id){
  S.moodLog=(S.moodLog||[]).filter(entry=>Number(entry.id)!==Number(id));
  renderMood();
  save();
  toast('تم حذف سجل المزاج');
}

function getRangeDates(startKey,days){
  return Array.from({length:days},(_value,index)=>shiftDateKey(startKey,index));
}

function habitCompletionPctForDates(dateKeys){
  const totalPossible=(S.habits||[]).length*dateKeys.length;
  if(!totalPossible)return 0;
  const doneCount=(S.habits||[]).reduce((sum,habit)=>sum+dateKeys.filter(date=>habit.done.includes(date)).length,0);
  return Math.round(doneCount/totalPossible*100);
}

function averageEnergyByWeekday(){
  const buckets=Array.from({length:7},()=>[]);
  (S.energyHistory||[]).forEach(entry=>{
    const day=parseDateKey(entry.date).getDay();
    buckets[day].push(Number(entry.value)||0);
  });
  return buckets.map((values,index)=>({
    label:DAYS_AR[index],
    avg:values.length?Math.round(values.reduce((sum,value)=>sum+value,0)/values.length):0,
  }));
}

function renderAnalytics(){
  const energyWrap=document.getElementById('energy-week-bars');
  const habitRatesEl=document.getElementById('analytics-habit-rates');
  const suggestionsEl=document.getElementById('smart-suggestions');
  if(!energyWrap||!habitRatesEl||!suggestionsEl)return;

  const energyData=averageEnergyByWeekday();
  energyWrap.innerHTML=energyData.map(item=>`<div class="energy-bar-col"><div class="energy-bar-shell"><div class="energy-bar-fill" style="height:${Math.max(8,item.avg*10)}%"></div></div><div class="stat-change stat-neutral">${toAr(item.avg)}</div><div class="stat-label">${escapeHtml(item.label.slice(0,2))}</div></div>`).join('');

  const thisWeekStart=weekStartKey(todayKey());
  const lastWeekStart=shiftDateKey(thisWeekStart,-7);
  const thisWeekDates=getRangeDates(thisWeekStart,7);
  const lastWeekDates=getRangeDates(lastWeekStart,7);
  const thisWeekPct=habitCompletionPctForDates(thisWeekDates);
  const lastWeekPct=habitCompletionPctForDates(lastWeekDates);
  const delta=thisWeekPct-lastWeekPct;
  const setText=(id,value)=>{
    const el=document.getElementById(id);
    if(el)el.textContent=value;
  };
  setText('analytics-this-week',`${toAr(thisWeekPct)}٪`);
  setText('analytics-last-week',`${toAr(lastWeekPct)}٪`);
  setText('analytics-week-trend',delta===0?'→':delta>0?'↑':'↓');
  const trendSub=document.getElementById('analytics-week-trend-sub');
  if(trendSub){
    trendSub.textContent=delta===0?'ثبات':`${delta>0?'+':''}${toAr(Math.abs(delta))}٪`;
    trendSub.className=`stat-change ${delta>0?'stat-up':delta<0?'stat-down':'stat-neutral'}`;
  }

  const bestHabit=(S.habits||[]).slice().sort((a,b)=>calcMaxStreak(b.done)-calcMaxStreak(a.done))[0];
  const worstHabit=(S.habits||[]).slice().sort((a,b)=>getHabitMonthRate(a)-getHabitMonthRate(b))[0];
  setText('analytics-best-habit',bestHabit?bestHabit.name:'—');
  setText('analytics-worst-habit',worstHabit?worstHabit.name:'—');
  habitRatesEl.innerHTML=(S.habits||[]).map(habit=>{
    const rate=getHabitMonthRate(habit);
    return `<div class="habit-rate-row"><div class="habit-rate-head"><span>${escapeHtml(habit.name)}</span><strong>${toAr(rate)}٪</strong></div><div class="prog-wrap"><div class="prog-fill prog-green" style="width:${rate}%"></div></div></div>`;
  }).join('')||'<div class="task-empty">لا توجد عادات بعد</div>';

  const suggestions=[];
  const lowEnergyDay=energyData.filter(item=>item.avg>0).sort((a,b)=>a.avg-b.avg)[0];
  if(lowEnergyDay&&lowEnergyDay.avg<=4){
    suggestions.push(`طاقتك بتكون أقل يوم ${lowEnergyDay.label} — خففي المهام الصعبة فيه.`);  
  }
  const zeroHabit=(S.habits||[]).find(habit=>getHabitMonthRate(habit)===0);
  if(zeroHabit){
    suggestions.push(`عادة ${zeroHabit.name} محتاجة انتباه — جربي ربطها بعادة أقوى قبلها.`);
  }
  const spending=(S.expenses||[]).filter(expense=>!isIncome(expense.cat)&&expense.cat!=='ادخار').reduce((sum,expense)=>sum+expense.amt,0);
  const savings=getSavingsTotal();
  if(spending>0&&savings<spending*0.1){
    const cats={};
    (S.expenses||[]).filter(expense=>!isIncome(expense.cat)&&expense.cat!=='ادخار').forEach(expense=>{cats[expense.cat]=(cats[expense.cat]||0)+expense.amt;});
    const topCategory=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
    suggestions.push(`مصاريفك بتتجاوز التحويش — فكري في تقليل فئة ${topCategory?topCategory[0]:'الأعلى إنفاقًا'}.`);
  }
  if(!suggestions.length){
    suggestions.push('استمرارك الحالي جيد — حافظي على عادة أساسية ثابتة يوميًا.', 'البيانات بدأت تتجمع، وبعد أيام أكثر ستظهر لك أنماط أوضح.', 'راجعي أسبوعك مرة واحدة فقط بدل متابعة كل شيء دفعة واحدة.');
  }
  suggestionsEl.innerHTML=suggestions.slice(0,3).map(text=>`<div class="suggestion-card">${escapeHtml(text)}</div>`).join('');
}

function ensurePomodoroFresh(){
  const pomodoro=S.pomodoro;
  if(!pomodoro.running||!pomodoro.lastTickAt)return;
  const now=Date.now();
  const elapsed=Math.floor((now-new Date(pomodoro.lastTickAt).getTime())/1000);
  if(elapsed<=0)return;
  pomodoro.lastTickAt=new Date(now).toISOString();
  pomodoro.remainingSec=Math.max(0,pomodoro.remainingSec-elapsed);
  if(pomodoro.remainingSec===0)completePomodoroCycle();
}

function pomodoroDuration(mode){
  return mode==='focus'?1500:300;
}

function setPomodoroMode(mode){
  ensurePomodoroFresh();
  S.pomodoro.mode=mode;
  S.pomodoro.remainingSec=pomodoroDuration(mode);
  S.pomodoro.running=false;
  S.pomodoro.lastTickAt=null;
  stopPomodoroInterval();
  renderPomodoro();
  save();
}

function formatTimer(sec){
  const minutes=Math.floor(sec/60);
  const seconds=sec%60;
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}

function stopPomodoroInterval(){
  if(pomodoroInterval){
    clearInterval(pomodoroInterval);
    pomodoroInterval=null;
  }
}

function startPomodoroInterval(){
  stopPomodoroInterval();
  pomodoroInterval=setInterval(()=>{
    ensurePomodoroFresh();
    renderPomodoro();
    saveCache();
  },1000);
}

function completePomodoroCycle(){
  const wasFocus=S.pomodoro.mode==='focus';
  if(wasFocus){
    const today=todayKey();
    if(!S.pomodoro.sessionsToday[today])S.pomodoro.sessionsToday[today]=0;
    S.pomodoro.sessionsToday[today]+=1;
    S.pomodoro.totalSessions+=1;
  }
  S.pomodoro.mode=wasFocus?'break':'focus';
  S.pomodoro.remainingSec=pomodoroDuration(S.pomodoro.mode);
  S.pomodoro.running=false;
  S.pomodoro.lastTickAt=null;
  stopPomodoroInterval();
  save();
  toast(wasFocus?'انتهت جلسة التركيز، خدي راحة':'انتهت الراحة، ارجعي للتركيز');
}

function togglePomodoro(){
  ensurePomodoroFresh();
  S.pomodoro.running=!S.pomodoro.running;
  S.pomodoro.lastTickAt=S.pomodoro.running?new Date().toISOString():null;
  if(S.pomodoro.running)startPomodoroInterval();
  else stopPomodoroInterval();
  renderPomodoro();
  save();
}

function skipPomodoro(){
  completePomodoroCycle();
  renderPomodoro();
}

function resetPomodoro(){
  S.pomodoro.remainingSec=pomodoroDuration(S.pomodoro.mode);
  S.pomodoro.running=false;
  S.pomodoro.lastTickAt=null;
  stopPomodoroInterval();
  renderPomodoro();
  save();
}

function renderPomodoro(){
  ensurePomodoroFresh();
  const display=document.getElementById('pomodoro-display');
  const state=document.getElementById('pomodoro-state');
  const sub=document.getElementById('pomodoro-sub');
  const toggle=document.getElementById('pomodoro-toggle-btn');
  const todaySessions=S.pomodoro.sessionsToday[todayKey()]||0;
  if(display)display.textContent=formatTimer(S.pomodoro.remainingSec);
  if(state)state.textContent=S.pomodoro.mode==='focus'?'جلسة تركيز':'وقت الراحة';
  if(sub)sub.textContent=S.pomodoro.mode==='focus'?'ركزي في مهمة واحدة حتى نهاية المؤقت':'قومي، اتحركي، وخدي نفس';
  if(toggle)toggle.textContent=S.pomodoro.running?langText('buttons.pause','إيقاف'):langText('buttons.start','ابدأ');
  const setText=(id,value)=>{
    const el=document.getElementById(id);
    if(el)el.textContent=value;
  };
  setText('pomodoro-today',toAr(todaySessions));
  setText('pomodoro-total',toAr(S.pomodoro.totalSessions));
  setText('pomodoro-mode-mini',S.pomodoro.mode==='focus'?'تركيز':'راحة');
  setText('pomodoro-run-state',S.pomodoro.running?'يعمل':'متوقف');
}

function filterTips(btn,cat){
  document.querySelectorAll('.tip-cat-btn').forEach(button=>button.classList.remove('active'));
  btn.classList.add('active');
  renderTips(cat);
}

function renderTips(cat){
  const filtered=cat==='all'?TIPS_DATA:TIPS_DATA.filter(tip=>tip.cat===cat);
  const container=document.getElementById('tips-list');
  if(!container)return;
  container.innerHTML=filtered.map(tip=>`<div class="tip-card"><div class="tip-card-top"><div class="tip-icon-box" style="background:${tip.iconbg}">${tip.icon}</div><div style="flex:1"><div class="tip-card-title">${tip.title}</div><div class="tip-card-summary">${tip.summary}</div><div class="tip-tags">${tip.tags.map(tag=>`<span class="chip chip-gold" style="font-size:10px;padding:2px 8px">${tag}</span>`).join('')}</div><button class="tip-expand-btn" onclick="toggleTip(${tip.id})"><span id="ta-${tip.id}">▼</span> اقري التفاصيل والخطوات</button></div></div><div class="tip-detail" id="td-${tip.id}"><div style="color:var(--text1);line-height:1.7;margin-bottom:10px">${tip.detail}</div><div style="font-size:10px;color:var(--text3);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px">الخطوات العملية</div><div class="tip-steps">${tip.steps.map((step,index)=>`<div class="tip-step"><div class="tip-step-num">${toAr(index+1)}</div><div>${step}</div></div>`).join('')}</div></div></div>`).join('');
}

function toggleTip(id){
  const detail=document.getElementById('td-'+id);
  const arrow=document.getElementById('ta-'+id);
  if(detail){
    const open=detail.classList.toggle('open');
    if(arrow)arrow.textContent=open?'▲':'▼';
  }
}
