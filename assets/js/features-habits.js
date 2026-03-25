// Habit tracking and habit exports.
function getWeekDays(){
  const today=todayKey();
  const days=[];
  const dayNamesAr = ['أحد','إثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
  const dayNamesEn = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  for(let i=6;i>=0;i--){
    const key=shiftDateKey(today,-i);
    const date=parseDateKey(key);
    days.push({label: (lang() === 'en' ? dayNamesEn : dayNamesAr)[date.getDay()], key, isToday:i===0});
  }
  return days;
}

function calcStreak(done){
  let streak=0;
  let key=todayKey();
  for(let i=0;i<60;i++){
    if(done.includes(key)){
      streak+=1;
      key=shiftDateKey(key,-1);
    }else{
      break;
    }
  }
  return streak;
}

function calcMaxStreak(done){
  const unique=[...new Set(done)].sort();
  let best=0;
  let current=0;
  let prev=null;
  unique.forEach(key=>{
    if(prev&&shiftDateKey(prev,1)===key)current+=1;
    else current=1;
    best=Math.max(best,current);
    prev=key;
  });
  return best;
}

function getLastNDates(days){
  const today=todayKey();
  const dates=[];
  for(let i=days-1;i>=0;i--)dates.push(shiftDateKey(today,-i));
  return dates;
}

function getHabitMonthRate(habit){
  const today=parseDateKey(todayKey());
  const year=today.getFullYear();
  const month=today.getMonth();
  const monthDone=(habit.done||[]).filter(date=>{
    const parsed=parseDateKey(date);
    return parsed.getFullYear()===year&&parsed.getMonth()===month;
  }).length;
  const daysElapsed=today.getDate();
  return daysElapsed?Math.round(monthDone/daysElapsed*100):0;
}

function renderHabitSummary(){
  const container=document.getElementById('habits-summary');
  if(!container)return;
  const weekdayCounts=Array.from({length:7},()=>0);
  (S.habits||[]).forEach(habit=>(habit.done||[]).forEach(date=>{
    weekdayCounts[parseDateKey(date).getDay()]+=1;
  }));
  const bestDayIndex=weekdayCounts.indexOf(Math.max(...weekdayCounts,0));
  const bestDay=weekdayCounts.some(Boolean)?DAYS_AR[bestDayIndex]:'—';
  const today=parseDateKey(todayKey());
  const daysElapsed=today.getDate();
  const monthDone=(S.habits||[]).reduce((sum,habit)=>sum+(habit.done||[]).filter(date=>{
    const parsed=parseDateKey(date);
    return parsed.getFullYear()===today.getFullYear()&&parsed.getMonth()===today.getMonth();
  }).length,0);
  const monthlyRate=S.habits.length&&daysElapsed?Math.round(monthDone/(S.habits.length*daysElapsed)*100):0;
  const bestHabit=(S.habits||[]).slice().sort((a,b)=>getHabitMonthRate(b)-getHabitMonthRate(a))[0];
  container.innerHTML=[
    `<div class="habit-summary-pill"><span class="stat-label">أفضل يوم</span><strong>${escapeHtml(bestDay)}</strong></div>`,
    `<div class="habit-summary-pill"><span class="stat-label">معدل الشهر</span><strong>${toAr(monthlyRate)}٪</strong></div>`,
    `<div class="habit-summary-pill"><span class="stat-label">الأكثر التزاماً</span><strong>${escapeHtml(bestHabit?bestHabit.name:'—')}</strong></div>`,
  ].join('');
}

function exportHabitsCsv(){
  const rows=[['id','name','total_done','current_streak','done_dates']];
  S.habits.forEach(habit=>rows.push([habit.id,habit.name,habit.done.length,calcStreak(habit.done),habit.done.join(' | ')]));
  downloadFile(`sama-habits-${todayKey()}.csv`,"\uFEFF"+rows.map(csvRow).join('\n'),'text/csv;charset=utf-8');
  toast(lang()==='en'?'Habits CSV exported':'تم تصدير CSV العادات');
}

function renderHabits(){
  const weekDays=getWeekDays();
  const list=document.getElementById('habits-list');
  if(!list)return;
  if(S.habits.length === 0){
    list.innerHTML='<div class="task-empty" style="grid-column:1/-1"><div class="empty-state"><div class="icon">🌱</div><div>ابدئي ببناء عاداتك اليومية</div></div></div>';
    return;
  }
  
  renderHabitSummary();
  list.innerHTML=S.habits.map((habit,habitIndex)=>{
    const streak=calcStreak(habit.done);
    const maxStreak=calcMaxStreak(habit.done);
    const dots=weekDays.map(day=>`
      <button type="button" class="habit-day-pill ${habit.done.includes(day.key)?'done':''} ${day.isToday?'today':''}" onclick="toggleHabit(${habitIndex},'${day.key}', event.currentTarget)" aria-label="${habit.name} - ${day.label}">
        <span class="habit-pill-label">${day.label}</span>
        <span class="habit-pill-mark">${habit.done.includes(day.key)?'<span class="check-icon">✓</span>':''}</span>
      </button>
    `).join('');
    
    // Very subtle mini heat-track
    const heat=getLastNDates(28).map(date=>`<span class="habit-mini-dot ${habit.done.includes(date)?'done':''}" title="${date}"></span>`).join('');
    
    return `
      <div class="habit-card">
        <div class="habit-card-top">
          <div class="habit-info">
            <h4 class="habit-title">${escapeHtml(habit.name)}</h4>
            <div class="habit-meta">
              <span class="streak-badge ${streak > 0 ? 'active' : ''}">
                <span class="streak-icon">🔥</span> ${toAr(streak)} متتالية
              </span>
              <span class="max-streak-txt">الأطول: ${toAr(maxStreak)}</span>
            </div>
          </div>
          <div class="habit-actions">
            <button class="icon-btn" onclick="openEditHabit(${habitIndex})" title="تعديل">✎</button>
            <button class="icon-btn danger" onclick="deleteHabit(${habitIndex})" title="حذف">🗑</button>
          </div>
        </div>
        <div class="habit-card-mid">
          <div class="habit-track-7">
            ${dots}
          </div>
        </div>
        <div class="habit-card-bottom">
          <div class="habit-mini-heat">${heat}</div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleHabit(hi,key,btnEl){
  if (btnEl && !btnEl.classList.contains('done')) {
    const ripple = document.createElement('div');
    ripple.className = 'habit-ripple';
    const rect = btnEl.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = ripple.style.top = '0';
    btnEl.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
  const arr=S.habits[hi].done;
  const idx=arr.indexOf(key);
  const adding=idx===-1;
  if(idx>-1)arr.splice(idx,1);
  else arr.push(key);
  if(adding)grantXp(15);
  renderHabits();
  updateLifeCards();
  renderStats();
  renderAchievements();
  save();
}

function addHabitModal(){
  openModal(lang()==='en'?'New Habit':'عادة جديدة','<div class="form-group"><label class="form-label">'+(lang()==='en'?'Habit Name':'اسم العادة')+'</label><input class="inp" id="new-habit-name" placeholder="'+(lang()==='en'?'Example: Drink 2L water':'مثلاً: شرب ٢ لتر ماء')+'"></div>',[{text:lang()==='en'?'Add':'إضافة',primary:true,fn:'confirmAddHabit'},{text:lang()==='en'?'Cancel':'إلغاء',fn:'closeModal'}]);
}

function confirmAddHabit(){
  const name=document.getElementById('new-habit-name').value.trim();
  if(!name){
    toast(lang()==='en'?'Enter habit name':'اكتبي اسم العادة');
    return;
  }
  S.habits.push({id:'h_'+Date.now(),name,done:[]});
  closeModal();
  renderHabits();
  save();
  toast(lang()==='en'?'Habit added':'تمت الإضافة ✓');
}

function openEditHabit(index){
  const habit=S.habits[index];
  if(!habit)return;
  openModal(lang()==='en'?'Edit Habit':'تعديل العادة','<div class="form-group"><label class="form-label">'+(lang()==='en'?'Habit Name':'اسم العادة')+'</label><input class="inp" id="edit-habit-name" value="'+escapeHtml(habit.name)+'"></div>',[{text:lang()==='en'?'Save':'حفظ',primary:true,fn:`confirmEditHabit(${index})`},{text:lang()==='en'?'Cancel':'إلغاء',fn:'closeModal'}]);
}

function confirmEditHabit(index){
  const habit=S.habits[index];
  if(!habit)return;
  const value=document.getElementById('edit-habit-name').value.trim();
  if(!value){
    toast(lang()==='en'?'Enter habit name':'اكتبي اسم العادة');
    return;
  }
  habit.name=value;
  closeModal();
  renderHabits();
  save();
  toast(lang()==='en'?'Habit updated':'تم تعديل العادة');
}

function deleteHabit(index){
  const habit=S.habits[index];
  if(!habit)return;
  if(!window.confirm(lang()==='en'?`Delete "${habit.name}"?`:`حذف عادة "${habit.name}"؟`))return;
  S.habits.splice(index,1);
  renderHabits();
  renderStats();
  updateLifeCards();
  renderAchievements();
  save();
  toast(lang()==='en'?'Habit deleted':'تم حذف العادة');
}
