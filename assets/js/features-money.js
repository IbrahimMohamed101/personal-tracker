// Money tracking, savings goal, and expense exports.
function csvRow(values){
  return values.map(value=>`"${String(value??'').replace(/"/g,'""')}"`).join(',');
}

function exportExpensesCsv(){
  const rows=[['id','date','category','note','amount']];
  S.expenses.forEach(expense=>rows.push([expense.id,expense.date,expense.cat,expense.note,expense.amt]));
  downloadFile(`sama-transactions-${todayKey()}.csv`,"\uFEFF"+rows.map(csvRow).join('\n'),'text/csv;charset=utf-8');
  toast(lang()==='en'?'Transactions CSV exported':'تم تصدير CSV المعاملات');
}

function syncMoneyCurrencyUi(){
  const setText=(id,value)=>{
    const el=document.getElementById(id);
    if(el)el.textContent=value;
  };
  const currencySelect=document.getElementById('money-currency-select');
  if(currencySelect)currencySelect.value=currencyCode();
  const amountInput=document.getElementById('m-amount');
  if(amountInput)amountInput.placeholder=`المبلغ (${currencySymbol()})`;
  setText('stat-savings-label',currencyShortName());
  setText('money-balance-sub',`${currencyShortName()} (دخل - مصاريف)`);
  setText('money-income-sub',`${currencyShortName()} مكتسب`);
  setText('money-total-sub',`${currencyShortName()} مصروف`);
  setText('m-savings-goal-currency',currencySymbol());
}

function updateCurrency(value){
  if(!S.settings||typeof S.settings!=='object')S.settings=createDefaultState().settings;
  const nextCurrency=getCurrencyOption(value).code;
  if(S.settings.currency===nextCurrency){
    syncMoneyCurrencyUi();
    return;
  }
  S.settings.currency=nextCurrency;
  syncMoneyCurrencyUi();
  renderMoney();
  renderStats();
  renderXpUi();
  renderAchievements();
  save();
  toast(`تم تغيير العملة إلى ${currencyName()}`);
}

function ensureBudgetDefaults(){
  if(!S.budgets||typeof S.budgets!=='object')S.budgets={};
  BUDGET_CATEGORIES.forEach(category=>{
    if(!S.budgets[category]){
      S.budgets[category]={id:budgetId(category),category,limit:0};
    }
  });
}

function getCurrentMonthRange(){
  const now=parseDateKey(todayKey());
  const start=new Date(now.getFullYear(),now.getMonth(),1);
  const end=new Date(now.getFullYear(),now.getMonth()+1,0);
  return {start:dateKeyFromDate(start),end:dateKeyFromDate(end)};
}

function getCategorySpentThisMonth(category){
  const {start,end}=getCurrentMonthRange();
  return (S.expenses||[]).filter(expense=>expense.cat===category&&expense.date>=start&&expense.date<=end).reduce((sum,expense)=>sum+expense.amt,0);
}

function isIncome(cat){
  return ['راتب','مكافأة','دخل إضافي'].includes(cat);
}

function updateBudget(category,value){
  ensureBudgetDefaults();
  S.budgets[category]={id:budgetId(category),category,limit:Math.max(0,Number(value)||0)};
  renderBudgetManager();
  save();
}

function calculateProjectedSavingsDate(){
  const savingsEntries=(S.expenses||[]).filter(expense=>expense.cat==='ادخار');
  const savings=getSavingsTotal();
  const remaining=Math.max(0,(Number(S.savingsGoal)||0)-savings);
  if(!savingsEntries.length||remaining<=0)return remaining<=0?'وصلتِ للهدف بالفعل ✦':'لا يوجد معدل كافٍ للتوقع بعد';
  const monthMap={};
  savingsEntries.forEach(entry=>{
    const key=String(entry.date).slice(0,7);
    monthMap[key]=(monthMap[key]||0)+entry.amt;
  });
  const monthlyAvg=Object.values(monthMap).reduce((sum,value)=>sum+value,0)/Math.max(1,Object.keys(monthMap).length);
  if(monthlyAvg<=0)return 'لا يوجد معدل كافٍ للتوقع بعد';
  const monthsNeeded=Math.ceil(remaining/monthlyAvg);
  const projected=new Date();
  projected.setMonth(projected.getMonth()+monthsNeeded);
  return `بالمعدل الحالي هتوصلي لهدفك في ${formatMonthYear(projected)}`;
}

function renderBudgetManager(){
  ensureBudgetDefaults();
  const container=document.getElementById('budget-list');
  if(!container)return;
  container.className='budget-list';
  container.innerHTML=BUDGET_CATEGORIES.map(category=>{
    const budget=S.budgets[category];
    const spent=getCategorySpentThisMonth(category);
    const limit=Math.max(0,Number(budget.limit)||0);
    const pct=limit?Math.round(spent/limit*100):0;
    let color='var(--green)';
    if(limit&&pct>100)color='var(--red)';
    else if(limit&&pct>=75)color='var(--amber)';
    return `<div class="budget-row"><div class="budget-head"><div><div class="budget-name">${escapeHtml(category)}</div><div class="budget-meta">${formatMoneyAmount(spent)} / ${formatMoneyAmount(limit)}</div></div><input class="inp budget-input" type="number" min="0" value="${limit}" onchange="updateBudget('${category}',this.value)"></div><div class="budget-track"><div class="budget-fill" style="width:${Math.min(100,pct)}%;background:${color}"></div></div></div>`;
  }).join('');
  const projection=document.getElementById('budget-projection');
  if(projection)projection.textContent=calculateProjectedSavingsDate();
}

function toggleSavingsGoalEdit(){
  editingSavingsGoal=!editingSavingsGoal;
  const editWrap=document.getElementById('m-savings-goal-edit');
  if(!editWrap)return;
  if(!editingSavingsGoal){
    editWrap.innerHTML='';
    return;
  }
  editWrap.innerHTML=`<div class="inline-edit-row"><input class="inp" id="m-savings-goal-input" type="number" min="0" value="${Math.max(0,Number(S.savingsGoal)||0)}"><button class="btn btn-primary btn-sm" onclick="saveSavingsGoalInline()">حفظ</button><button class="btn btn-ghost btn-sm" onclick="toggleSavingsGoalEdit()">إلغاء</button></div>`;
}

function saveSavingsGoalInline(){
  const input=document.getElementById('m-savings-goal-input');
  S.savingsGoal=Math.max(0,Math.round(Number(input&&input.value)||0));
  editingSavingsGoal=false;
  renderMoney();
  renderStats();
  save();
  toast('تم تعديل هدف التحويش');
}

function addExpense(){
  const amt=parseFloat(document.getElementById('m-amount').value);
  const cat=document.getElementById('m-cat').value;
  const note=document.getElementById('m-note').value.trim();
  if(!amt||isNaN(amt)||amt<=0){
    toast(lang()==='en'?'Enter a valid amount':'أدخلي مبلغ صحيح');
    return;
  }
  S.expenses.unshift({id:generateNumericId(),amt,cat,note,date:todayKey(),createdAt:new Date().toISOString()});
  ensureBudgetDefaults();
  document.getElementById('m-amount').value='';
  document.getElementById('m-note').value='';
  let exceededBudget=false;
  if(cat!=='ادخار' && !isIncome(cat)){
    const limit=Math.max(0,Number((S.budgets[cat]||{}).limit)||0);
    const spent=getCategorySpentThisMonth(cat);
    if(limit&&spent>limit)exceededBudget=true;
  }
  grantXp(5);
  updateWeeklyChallengeProgress();
  renderMoney();
  renderStats();
  renderAchievements();
  updateLifeCards();
  save();
  if(exceededBudget)toast(`تجاوزتِ حد ${cat}!`,2600);
  else toast(cat==='ادخار'?'💚 تم إضافة الادخار!':isIncome(cat)?'💰 تم إضافة الدخل!':'✓ تم تسجيل المصروف');
}

function renderMoney(){
  ensureBudgetDefaults();
  syncMoneyCurrencyUi();
  const savings=S.expenses.filter(expense=>expense.cat==='ادخار').reduce((sum,expense)=>sum+expense.amt,0);
  const income=S.expenses.filter(expense=>isIncome(expense.cat)).reduce((sum,expense)=>sum+expense.amt,0);
  const total=S.expenses.filter(expense=>!isIncome(expense.cat)&&expense.cat!=='ادخار').reduce((sum,expense)=>sum+expense.amt,0);
  const balance=income-total;
  const balanceEl=document.getElementById('m-balance');
  if(balanceEl)balanceEl.textContent=toArFull(balance<0?0:balance);
  const incomeEl=document.getElementById('m-income');
  if(incomeEl)incomeEl.textContent=toArFull(income);
  
  const bar=document.getElementById('m-balance-bar');
  if(bar){
    const pct=income>0?Math.max(0,Math.min(100,Math.round((balance/income)*100))):0;
    bar.style.width=pct+'%';
  }
  
  const savingsNav=document.getElementById('m-savings-nav');
  if(savingsNav)savingsNav.textContent=formatMoneyAmount(savings);

  const goalVal=document.getElementById('m-savings-goal-val');
  if(goalVal)goalVal.textContent=toArFull(S.savingsGoal);

  const sBar=document.getElementById('m-savings-bar');
  if(sBar){
    const sPct=S.savingsGoal>0?Math.max(0,Math.min(100,Math.round((savings/S.savingsGoal)*100))):0;
    sBar.style.width=sPct+'%';
  }

  const totalEl=document.getElementById('m-total');
  if(totalEl)totalEl.textContent=toArFull(total);
  const cats={};
  S.expenses.filter(expense=>!isIncome(expense.cat)&&expense.cat!=='ادخار').forEach(expense=>{cats[expense.cat]=(cats[expense.cat]||0)+expense.amt;});
  const catsEl=document.getElementById('m-cats');
  if(catsEl)catsEl.innerHTML=Object.keys(cats).length?Object.entries(cats).slice(0,5).map(([cat,value])=>`<div class="money-summary-row" style="font-size:12px"><span>${cat}</span><span>${formatMoneyAmount(value)}</span></div>`).join(''):'<div class="exp-empty" style="padding:12px 0">لا توجد فئات مصروفات بعد</div>';
  const log=document.getElementById('exp-log');
  if(log)log.innerHTML=S.expenses.length===0?'<div class="exp-empty"><div class="empty-state"><div class="icon">◈</div><div>سجلي أول عملية ليكِ</div></div></div>':S.expenses.slice(0,25).map(expense=>`<div class="exp-item"><span class="exp-item-cat">${escapeHtml(expense.cat)}</span><span class="exp-item-note">${escapeHtml(expense.note||'بدون ملاحظة')}</span><span class="exp-item-amt ${expense.cat==='ادخار'||isIncome(expense.cat)?'savings':''}">${formatMoneyAmount(expense.amt,{prefix:isIncome(expense.cat)?'+':''})}</span><span class="exp-item-date">${formatShortDate(expense.date)}</span><span class="exp-item-actions"><button class="mini-action danger" onclick="deleteExpense(${expense.id})">حذف</button></span></div>`).join('');
  renderBudgetManager();
}

function deleteExpense(id){
  const expense=S.expenses.find(item=>Number(item.id)===Number(id));
  if(!expense)return;
  if(!window.confirm(lang()==='en'?'Delete this expense?':'حذف هذا المصروف؟'))return;
  S.expenses=S.expenses.filter(item=>Number(item.id)!==Number(id));
  renderMoney();
  renderStats();
  updateLifeCards();
  renderAchievements();
  updateWeeklyChallengeProgress();
  save();
  toast(lang()==='en'?'Expense deleted':'تم حذف المصروف');
}

function openSavingsGoalModal(){
  openModal(lang()==='en'?'Savings Goal':'هدف التحويش','<div class="form-group"><label class="form-label">'+(lang()==='en'?'Target Amount':'المبلغ المستهدف')+'</label><input class="inp" id="savings-goal-input" type="number" min="0" value="'+escapeHtml(S.savingsGoal)+'"></div>',[{text:lang()==='en'?'Save':'حفظ',primary:true,fn:'confirmSavingsGoal'},{text:lang()==='en'?'Cancel':'إلغاء',fn:'closeModal'}]);
}

function confirmSavingsGoal(){
  const value=Math.max(0,Math.round(Number(document.getElementById('savings-goal-input').value)||0));
  S.savingsGoal=value;
  closeModal();
  renderMoney();
  renderStats();
  save();
  toast(lang()==='en'?'Goal updated':'تم تعديل هدف التحويش');
}
