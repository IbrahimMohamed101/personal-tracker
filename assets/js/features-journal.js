// Journal page and daily reflection entries.
function journalMoodMeta(value){
  return JOURNAL_MOOD_OPTIONS.find(option=>option.value===value)||JOURNAL_MOOD_OPTIONS[3];
}

function selectJournalMood(value){
  selectedJournalMood=value;
  renderJournal();
}

function getTodayJournalEntry(){
  return (S.journal||[]).find(entry=>entry.date===todayKey())||null;
}

function renderJournalMoodButtons(){
  const container=document.getElementById('journal-mood-options');
  if(!container)return;
  if(selectedJournalMood===null){
    const todayEntry=getTodayJournalEntry();
    selectedJournalMood=todayEntry?todayEntry.mood:4;
  }
  container.innerHTML=JOURNAL_MOOD_OPTIONS.map(option=>`<button type="button" class="journal-mood-btn ${selectedJournalMood===option.value?'active':''}" onclick="selectJournalMood(${option.value})"><span class="mood-emoji">${option.emoji}</span><span class="mood-name">${escapeHtml(option.label)}</span></button>`).join('');
}

function renderJournal(){
  const currentValues={
    gratitude1:(document.getElementById('journal-gratitude-1')||{}).value||'',
    gratitude2:(document.getElementById('journal-gratitude-2')||{}).value||'',
    gratitude3:(document.getElementById('journal-gratitude-3')||{}).value||'',
    content:(document.getElementById('journal-content')||{}).value||'',
  };
  renderJournalMoodButtons();
  const entry=getTodayJournalEntry();
  const setValue=(id,value)=>{
    const el=document.getElementById(id);
    if(el)el.value=value||'';
  };
  setValue('journal-gratitude-1',currentValues.gratitude1||(entry&&entry.date===todayKey()?entry.gratitude1:''));
  setValue('journal-gratitude-2',currentValues.gratitude2||(entry&&entry.date===todayKey()?entry.gratitude2:''));
  setValue('journal-gratitude-3',currentValues.gratitude3||(entry&&entry.date===todayKey()?entry.gratitude3:''));
  setValue('journal-content',currentValues.content||(entry&&entry.date===todayKey()?entry.content:''));
  const energyChip=document.getElementById('journal-energy-chip');
  if(energyChip)energyChip.textContent=`الطاقة: ${toAr(S.energy)}/١٠`;
  const history=document.getElementById('journal-history');
  if(!history)return;
  const rows=(S.journal||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,7);
  if(!rows.length){
    history.innerHTML='<div class="task-empty"><div class="empty-state"><div class="icon">📝</div><div>اكتبي أول يومية</div></div></div>';
    return;
  }
  history.innerHTML=rows.map(item=>{
    const mood=journalMoodMeta(item.mood);
    const preview=item.content?`${item.content.slice(0,60)}${item.content.length>60?'...':''}`:'بدون نص';
    const gratitude=[item.gratitude1,item.gratitude2,item.gratitude3].filter(Boolean);
    return `<details class="journal-card"><summary><div class="journal-summary"><div class="journal-summary-main"><span class="mood-emoji">${mood.emoji}</span><div><div class="habit-name">${escapeHtml(item.date)}</div><div class="page-subtitle">${escapeHtml(preview)}</div></div></div><span class="chip chip-blue">${escapeHtml(mood.label)}</span></div></summary><div class="journal-body">${item.content?escapeHtml(item.content):'بدون نص'}${gratitude.length?`<div class="journal-gratitude-list">${gratitude.map(line=>`<div class="journal-gratitude-item">${escapeHtml(line)}</div>`).join('')}</div>`:''}</div></details>`;
  }).join('');
}

function saveJournal(){
  const existing=getTodayJournalEntry();
  const isFirstEntry=!existing;
  const entry={
    id:existing?existing.id:generateNumericId(),
    date:todayKey(),
    content:(document.getElementById('journal-content')||{}).value?.trim()||'',
    gratitude1:(document.getElementById('journal-gratitude-1')||{}).value?.trim()||'',
    gratitude2:(document.getElementById('journal-gratitude-2')||{}).value?.trim()||'',
    gratitude3:(document.getElementById('journal-gratitude-3')||{}).value?.trim()||'',
    energy:S.energy,
    mood:selectedJournalMood||4,
    createdAt:existing?existing.createdAt:new Date().toISOString(),
  };
  if(existing){
    Object.assign(existing,entry);
  }else{
    S.journal.unshift(entry);
  }
  if(isFirstEntry)grantXp(15);
  const msg=document.getElementById('journal-saved-msg');
  if(msg){
    msg.style.display='inline';
    setTimeout(()=>msg.style.display='none',2500);
  }
  updateWeeklyChallengeProgress();
  renderJournal();
  updateLifeCards();
  renderAchievements();
  save();
  toast('تم حفظ اليومية');
}
