// Problems, goals, and weekly review flows.
const STATUS_INFO={todo:{lbl:'للتجربة',cls:'chip-amber'},exp:{lbl:'جاري التجربة',cls:'chip-blue'},done:{lbl:'محلولة ✓',cls:'chip-green'}};

function renderProblems(){
  const container=document.getElementById('problems-list');
  if(!container)return;
  container.innerHTML=S.problems.length?S.problems.map((problem,index)=>`<div class="problem-card"><div class="prob-top"><div class="prob-title">${escapeHtml(problem.title)}</div><span class="chip ${STATUS_INFO[problem.status]?.cls||'chip-amber'} status-cycle" onclick="cycleStatus(${index})">${STATUS_INFO[problem.status]?.lbl||'للتجربة'}</span></div><div class="prob-body">💡 الحل: ${escapeHtml(problem.solution)}</div>${problem.note?'<div class="prob-body" style="margin-top:4px;color:var(--text3)">📝 '+escapeHtml(problem.note)+'</div>':''}<div class="prob-meta"><span style="font-size:11px;color:var(--text3)">⏱ ${escapeHtml(problem.duration)}</span><button class="btn btn-ghost btn-sm" onclick="deleteProblem(${index})" style="margin-right:auto;color:var(--red);border:none;font-size:11px;padding:2px 8px">حذف</button></div></div>`).join(''):'<div class="task-empty" style="grid-column:1/-1"><div class="empty-state"><div class="icon" style="opacity:0.4">🎯</div><div>لا توجد تحديات مسجلة</div></div></div>';
}

function cycleStatus(index){
  const order=['todo','exp','done'];
  const current=S.problems[index].status||'todo';
  S.problems[index].status=order[(order.indexOf(current)+1)%3];
  if(current!=='done'&&S.problems[index].status==='done')grantXp(40);
  renderProblems();
  renderStats();
  renderAchievements();
  save();
  if(S.problems[index].status==='done')toast('🎉 مشكلة محلولة!');
}

function deleteProblem(index){
  S.problems.splice(index,1);
  renderProblems();
  save();
  toast('تم الحذف');
}

function openAddProblem(){
  openModal('مشكلة جديدة','<div class="form-group"><label class="form-label">اسم المشكلة</label><input class="inp" id="p-title" placeholder="مثلاً: مش بذاكر بانتظام"></div><div class="form-group"><label class="form-label">الحل المقترح</label><input class="inp" id="p-solution" placeholder="مثلاً: مذاكرة ١٥ دقيقة يومياً"></div><div class="form-group"><label class="form-label">مدة التجربة</label><input class="inp" id="p-duration" placeholder="مثلاً: ٧ أيام"></div><div class="form-group"><label class="form-label">ملاحظة اختيارية</label><textarea class="inp" id="p-note" style="min-height:60px" placeholder="أي تفاصيل..."></textarea></div>',[{text:'إضافة',primary:true,fn:'confirmAddProblem'},{text:'إلغاء',fn:'closeModal'}]);
}

function confirmAddProblem(){
  const title=document.getElementById('p-title').value.trim();
  const solution=document.getElementById('p-solution').value.trim();
  const duration=document.getElementById('p-duration').value.trim()||'٧ أيام';
  const note=document.getElementById('p-note').value.trim();
  if(!title){
    toast('اكتبي اسم المشكلة');
    return;
  }
  if(!solution){
    toast('اكتبي حل مقترح');
    return;
  }
  S.problems.push({id:generateNumericId(),title,solution,duration,note,status:'todo',createdAt:new Date().toISOString()});
  closeModal();
  renderProblems();
  save();
  toast('تمت الإضافة ✓');
}

function renderGoals(){
  const container=document.getElementById('goals-list');
  if(!container)return;
  container.innerHTML=S.goals.length?S.goals.map((goal,index)=>`<div class="goal-card"><div class="goal-top"><div class="goal-icon-wrap">${escapeHtml(goal.icon)}</div><div style="flex:1"><div class="goal-title">${escapeHtml(goal.title)}</div><div class="goal-timeline">${escapeHtml(goal.detail)} • ${escapeHtml(goal.deadline)}</div></div><div class="goal-pct-num" id="gpn-${index}">${toAr(goal.pct)}٪</div></div><div class="prog-wrap"><div class="prog-fill prog-gold" id="gpb-${index}" style="width:${goal.pct}%"></div></div><input type="range" class="goal-slider" min="0" max="100" value="${goal.pct}" oninput="updateGoalPct(${index},this.value)"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);margin-top:3px"><span>٠٪</span><span>١٠٠٪</span></div></div>`).join(''):'<div class="task-empty" style="grid-column:1/-1"><div class="empty-state"><div class="icon" style="opacity:0.4">🏆</div><div>ضعي هدفاً لتتبعه</div></div></div>';
}

function updateGoalPct(index,val){
  S.goals[index].pct=parseInt(val,10);
  const pctEl=document.getElementById('gpn-'+index);
  if(pctEl)pctEl.textContent=toAr(val)+'٪';
  const bar=document.getElementById('gpb-'+index);
  if(bar)bar.style.width=val+'%';
  save();
}

function openAddGoal(){
  openModal('هدف جديد','<div class="form-group"><label class="form-label">الأيقونة</label><input class="inp" id="g-icon" value="🎯" style="width:70px"></div><div class="form-group"><label class="form-label">اسم الهدف</label><input class="inp" id="g-title" placeholder="مثلاً: إنجليزي أحسن"></div><div class="form-group"><label class="form-label">التفاصيل</label><input class="inp" id="g-detail" placeholder="مثلاً: مستوى B2"></div><div class="form-group"><label class="form-label">الإطار الزمني</label><input class="inp" id="g-deadline" placeholder="مثلاً: ٣ شهور"></div>',[{text:'إضافة',primary:true,fn:'confirmAddGoal'},{text:'إلغاء',fn:'closeModal'}]);
}

function confirmAddGoal(){
  const icon=document.getElementById('g-icon').value.trim()||'🎯';
  const title=document.getElementById('g-title').value.trim();
  const detail=document.getElementById('g-detail').value.trim()||'';
  const deadline=document.getElementById('g-deadline').value.trim()||'٣ شهور';
  if(!title){
    toast('اكتبي اسم الهدف');
    return;
  }
  S.goals.push({id:generateNumericId(),icon,title,detail,deadline,pct:0});
  closeModal();
  renderGoals();
  save();
  toast('تمت الإضافة ✓');
}

function loadWeekly(){
  ['w1','w2','w3','w4'].forEach(key=>{
    const el=document.getElementById('wq'+key.slice(1));
    if(el)el.value=S.weekly[key]||'';
  });
  renderWeeklyHistory();
}

function saveWeekly(){
  ['w1','w2','w3','w4'].forEach(key=>{
    const el=document.getElementById('wq'+key.slice(1));
    if(el)S.weekly[key]=el.value;
  });
  if(S.weekly.w1||S.weekly.w2||S.weekly.w3){
    const weekStart=weekStartKey(todayKey());
    const existingCurrent=(S.weeklyHistory||[]).find(entry=>weekStartKey(entry.date)===weekStart);
    const entry={id:existingCurrent&&existingCurrent.id?existingCurrent.id:generateNumericId(),date:todayKey(),w1:S.weekly.w1,w2:S.weekly.w2,w3:S.weekly.w3,w4:S.weekly.w4,createdAt:existingCurrent&&existingCurrent.createdAt?existingCurrent.createdAt:new Date().toISOString()};
    if(!S.weeklyHistory)S.weeklyHistory=[];
    S.weeklyHistory=S.weeklyHistory.filter(item=>weekStartKey(item.date)!==weekStart);
    S.weeklyHistory.unshift(entry);
    if(S.weeklyHistory.length>8)S.weeklyHistory=S.weeklyHistory.slice(0,8);
    if(!existingCurrent)grantXp(50);
  }
  renderAchievements();
  save();
  const msg=document.getElementById('weekly-saved-msg');
  if(msg){
    msg.style.display='inline';
    setTimeout(()=>msg.style.display='none',2500);
  }
  toast('✓ تم حفظ المراجعة');
  renderWeeklyHistory();
}

function renderWeeklyHistory(){
  const el=document.getElementById('weekly-history');
  if(!el)return;
  const history=(S.weeklyHistory||[]).slice(1);
  if(!history.length){
    el.innerHTML='';
    return;
  }
  el.innerHTML='<div class="section-label">مراجعات سابقة</div>'+history.map(item=>`<details style="margin-bottom:8px"><summary style="cursor:pointer;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);font-size:13px;color:var(--text1)">${escapeHtml(item.date)}</summary><div style="padding:12px 14px;background:var(--bg1);border:1px solid var(--border);border-top:none;border-radius:0 0 var(--radius) var(--radius);font-size:13px;color:var(--text2);line-height:1.7">${item.w1?'<b style="color:var(--green)">نجح:</b> '+escapeHtml(item.w1)+'<br>':''}${item.w2?'<b style="color:var(--red)">فشل:</b> '+escapeHtml(item.w2)+'<br>':''}${item.w3?'<b style="color:var(--gold)">تغيير:</b> '+escapeHtml(item.w3)+'<br>':''}${item.w4?'<b style="color:var(--blue)">درس:</b> '+escapeHtml(item.w4):''}</div></details>`).join('');
}
