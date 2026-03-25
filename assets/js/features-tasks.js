// Daily tasks page and recurring task behavior.
function daysBetween(fromKey,toKey){
  const oneDay=24*60*60*1000;
  return Math.floor((parseDateKey(toKey).getTime()-parseDateKey(fromKey).getTime())/oneDay);
}

function refreshRecurringTasks(){
  const today=todayKey();
  let changed=false;
  (S.tasks||[]).forEach(task=>{
    if(task.repeatType==='daily'&&task.date<today){
      task.date=today;
      task.done=false;
      changed=true;
      return;
    }
    if(task.repeatType==='weekly'&&daysBetween(task.date,today)>=7){
      task.date=today;
      task.done=false;
      changed=true;
    }
  });
  if(changed)save();
}

function renderTaskGoalOptions(){
  const select=document.getElementById('task-goal-select');
  if(!select)return;
  const options=['<option value="">بدون ربط</option>'].concat((S.goals||[]).map(goal=>`<option value="${goal.id}">${escapeHtml(goal.title)}</option>`));
  select.innerHTML=options.join('');
}

function getTodayTasks(){
  const today=todayKey();
  return (S.tasks||[]).filter(task=>task.date===today).sort((a,b)=>{
    if(a.done!==b.done)return a.done?1:-1;
    return String(a.createdAt).localeCompare(String(b.createdAt));
  });
}

function taskGoalLabel(goalId){
  if(!goalId)return '';
  const goal=(S.goals||[]).find(item=>Number(item.id)===Number(goalId));
  return goal?goal.title:'';
}

function renderTaskItem(task){
  const priority=TASK_PRIORITY_META[task.priority]||TASK_PRIORITY_META.normal;
  const repeat=TASK_REPEAT_META[task.repeatType]||TASK_REPEAT_META.none;
  const goalName=taskGoalLabel(task.goalId);
  return `<div class="task-item ${task.done?'done':''}">
    <div class="task-main">
      <input type="checkbox" ${task.done?'checked':''} onchange="toggleTaskDone(${task.id},this.checked)">
      <div class="task-body">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span class="chip ${priority.chip||''}"><span class="priority-dot" style="background:${priority.color}"></span>${priority.label}</span>
          <span class="chip chip-blue">${repeat.label}</span>
          ${goalName?`<span class="chip chip-gold">${escapeHtml(goalName)}</span>`:''}
        </div>
      </div>
      <button class="mini-action danger" onclick="deleteTask(${task.id})">حذف</button>
    </div>
  </div>`;
}

function renderTasks(){
  refreshRecurringTasks();
  renderTaskGoalOptions();
  const pendingEl=document.getElementById('tasks-pending');
  const completedEl=document.getElementById('tasks-completed');
  const tasks=getTodayTasks();
  if(!pendingEl||!completedEl)return;
  const pending=tasks.filter(task=>!task.done);
  const completed=tasks.filter(task=>task.done);
  pendingEl.innerHTML=pending.length?pending.map(renderTaskItem).join(''):'<div class="task-empty"><div class="empty-state"><div class="icon">✅</div><div>يومك نظيف — أضيفي مهمة</div></div></div>';
  completedEl.innerHTML=completed.length?completed.map(renderTaskItem).join(''):'<div class="task-empty"><div class="empty-state"><div class="icon" style="opacity:0.4">✓</div><div>لا توجد مهام مكتملة بعد</div></div></div>';
  const xpToday=completed.reduce((sum,task)=>sum+(TASK_PRIORITY_META[task.priority]||TASK_PRIORITY_META.normal).xp,0);
  const mini=document.getElementById('tasks-xp-mini');
  if(mini)mini.textContent=`${toAr(xpToday)} XP اليوم`;
}

function addTask(){
  const title=(document.getElementById('task-title-input')||{}).value?.trim()||'';
  const priority=(document.getElementById('task-priority-select')||{}).value||'normal';
  const repeatType=(document.getElementById('task-repeat-select')||{}).value||'none';
  const goalIdRaw=(document.getElementById('task-goal-select')||{}).value||'';
  if(!title){
    toast('اكتبي المهمة أولاً');
    return;
  }
  S.tasks.unshift({
    id:generateNumericId(),
    title,
    priority:['urgent','important','normal'].includes(priority)?priority:'normal',
    repeatType:['none','daily','weekly'].includes(repeatType)?repeatType:'none',
    goalId:goalIdRaw?Number(goalIdRaw):null,
    done:false,
    date:todayKey(),
    createdAt:new Date().toISOString(),
  });
  document.getElementById('task-title-input').value='';
  document.getElementById('task-priority-select').value='normal';
  document.getElementById('task-repeat-select').value='none';
  document.getElementById('task-goal-select').value='';
  renderTasks();
  save();
  toast('تمت إضافة المهمة');
}

function toggleTaskDone(id,checked){
  const task=(S.tasks||[]).find(item=>Number(item.id)===Number(id));
  if(!task)return;
  const wasDone=task.done;
  task.done=Boolean(checked);
  if(!wasDone&&task.done){
    grantXp((TASK_PRIORITY_META[task.priority]||TASK_PRIORITY_META.normal).xp);
  }
  renderTasks();
  renderAchievements();
  updateLifeCards();
  save();
}

function deleteTask(id){
  S.tasks=(S.tasks||[]).filter(task=>Number(task.id)!==Number(id));
  renderTasks();
  updateLifeCards();
  save();
  toast('تم حذف المهمة');
}
