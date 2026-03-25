const DESKTOP_NAV_SECTIONS=[
  {label:'الرئيسية',items:[{page:'home',icon:'⬡',label:'لوحة القيادة',active:true}]},
  {
    label:'التتبع',
    items:[
      {page:'tasks',icon:'✅',label:'المهام اليومية'},
      {page:'habits',icon:'◎',label:'العادات اليومية'},
      {page:'money',icon:'◈',label:'المصاريف والتحويش'},
      {page:'problems',icon:'◫',label:'إدارة المشاكل'},
      {page:'journal',icon:'📝',label:'اليومية'},
      {page:'analytics',icon:'📊',label:'التحليلات'},
    ],
  },
  {
    label:'التخطيط',
    items:[
      {page:'goals',icon:'◬',label:'أهداف ٣ شهور'},
      {page:'weekly',icon:'◧',label:'المراجعة الأسبوعية'},
    ],
  },
  {
    label:'التطوير',
    items:[
      {page:'pomodoro',icon:'◴',label:'مؤقت بومودورو'},
      {page:'achievements',icon:'🏆',label:'الإنجازات'},
      {page:'guide',icon:'💡',label:'دليل التطور'},
      {page:'tips',icon:'✦',label:'مكتبة النصائح',badge:'١٢'},
      {page:'settings',icon:'⚙',label:'الإعدادات'},
    ],
  },
];

const MOBILE_NAV_ITEMS=[
  {page:'home',icon:'⬡',label:'الرئيسية',active:true},
  {page:'tasks',icon:'✅',label:'المهام'},
  {page:'habits',icon:'◎',label:'العادات'},
  {page:'money',icon:'◈',label:'المال'},
  {page:'problems',icon:'◫',label:'المشاكل'},
  {page:'journal',icon:'📝',label:'اليومية'},
  {page:'analytics',icon:'📊',label:'تحليلات'},
  {page:'goals',icon:'◬',label:'الأهداف'},
  {page:'weekly',icon:'◧',label:'الأسبوعي'},
  {page:'pomodoro',icon:'◴',label:'بومودورو'},
  {page:'achievements',icon:'🏆',label:'الإنجازات'},
  {page:'guide',icon:'💡',label:'دليل التطور'},
  {page:'tips',icon:'✦',label:'النصائح'},
  {page:'settings',icon:'⚙',label:'الإعدادات'},
  {page:'logout',icon:'🚪',label:'خروج', action: 'logout()'},
];

function renderDesktopNavItem(item){
  return `<div class="nav-item ${item.active?'active':''}" data-page="${item.page}" onclick="goPage('${item.page}')"><span class="nav-icon">${item.icon}</span><span class="nav-item-copy"><span class="nav-item-text">${item.label}</span>${item.badge?`<span class="nav-badge">${item.badge}</span>`:''}</span></div>`;
}

function renderDesktopNavSection(section,index){
  const content=[`<div class="nav-label"><span class="nav-label-shell">${section.label}</span></div>`,section.items.map(renderDesktopNavItem).join('')];
  if(index<DESKTOP_NAV_SECTIONS.length-1)content.push('<div class="nav-sep"></div>');
  return content.join('');
}
function renderDesktopSidebar(){
  return `<nav class="sidebar">
  <div class="sidebar-shell-head">
    <div class="sidebar-logo">
      <div class="logo-mark">Personal Tracker</div>
      <div class="logo-sub">Life Flight System</div>
    </div>
    <button class="sidebar-toggle" id="sidebar-toggle" type="button" onclick="toggleSidebarCollapse()" aria-label="طي الشريط الجانبي" title="طي الشريط الجانبي">
      <span class="sidebar-toggle-core" aria-hidden="true"></span>
      <span class="sidebar-toggle-icon" aria-hidden="true">◫</span>
    </button>
  </div>
  <div class="sidebar-date">
    <strong id="s-date">—</strong>
    <span id="s-time">—</span>
  </div>
  <div class="sidebar-sync">
    <div class="sync-indicator syncing" id="sync-indicator"><span class="sync-dot"></span><span id="sync-text">syncing...</span></div>
  </div>
  <div class="nav-section">
    ${DESKTOP_NAV_SECTIONS.map(renderDesktopNavSection).join('')}
  </div>
  <div class="energy-widget">
    <div class="ew-label">طاقتك اليوم</div>
    <div class="ew-row">
      <div class="ew-num" id="ew-num">5</div>
      <div class="ew-track"><input type="range" min="1" max="10" value="5" id="energy-rng" oninput="setEnergy(this.value)"></div>
    </div>
    <div class="ew-desc" id="ew-desc">طاقة متوسطة — خطوات صغيرة</div>
  </div>
  ${renderXpValueWidget()}
  <div class="sidebar-footer" style="padding: 10px 20px; margin-top: auto;">
    <button class="btn btn-ghost btn-sm" onclick="logout()" style="width:100%;justify-content:center;border-color:var(--red-dim);color:var(--red)">تسجيل الخروج</button>
  </div>
</nav>`;
}

function renderXpValueWidget(){
  const username = escapeHtml(localStorage.getItem('sama_username') || (lang()==='en' ? 'User' : 'مستخدم جديد'));
  return `<div class="xp-widget">
    <div class="xp-widget-head">
      <div class="xp-widget-title" id="xp-level-title">المستوى ١ ✦</div>
      <div class="xp-widget-num" id="xp-level-mini">٠ / ٢٠٠</div>
    </div>
    <div class="prog-wrap xp-prog"><div class="prog-fill prog-gold" id="xp-bar" style="width:0%"></div></div>
    <div class="xp-widget-sub" style="margin-top:8px;font-weight:600;color:var(--gold)">${username}</div>
    <div class="xp-widget-sub" id="xp-challenge-mini" style="margin-top:4px">لا يوجد تحدي أسبوعي بعد</div>
  </div>`;
}

function renderMobileNavItem(item){
  const clickAction = item.action ? item.action : `goPage('${item.page}')`;
  return `<button class="mobile-nav-btn ${item.active?'active':''}" data-page="${item.page}" onclick="${clickAction}"><span class="mobile-nav-icon">${item.icon}</span><span>${item.label}</span></button>`;
}

function renderMobileShell(){
  return `<div class="mobile-shell">
    <div class="mobile-topbar">
      <div>
        <div class="mobile-brand">Personal Tracker</div>
        <div class="mobile-caption">منظمك الشخصي</div>
      </div>
      <div class="mobile-side-meta">
        <div class="mobile-energy">الطاقة <strong id="m-energy-mini">٥/١٠</strong></div>
        <div class="mobile-clock">
          <strong id="m-date">—</strong>
          <span id="m-time">—</span>
        </div>
        <div class="sync-indicator syncing mobile-sync" id="sync-indicator-mobile"><span class="sync-dot"></span><span id="sync-text-mobile">syncing...</span></div>
      </div>
      <div class="mobile-xp-widget">
        <div class="mobile-xp-top"><span id="m-xp-level">المستوى ١ ✦</span><span id="m-xp-mini">٠/٢٠٠</span></div>
        <div class="prog-wrap xp-prog"><div class="prog-fill prog-gold" id="m-xp-bar" style="width:0%"></div></div>
      </div>
    </div>
    <div class="mobile-nav" aria-label="أقسام النظام">
      <div class="mobile-nav-track">
        ${MOBILE_NAV_ITEMS.map(renderMobileNavItem).join('')}
      </div>
    </div>
  </div>`;
}

function renderHomePage(){
  const levelData=xpIntoLevel(S.xp||0);
  const today=todayKey();
  const habitsDone=(S.habits||[]).filter(habit=>habit.done.includes(today)).length;
  const habitsPct=S.habits.length?Math.round(habitsDone/S.habits.length*100):0;
  const todayTasks=(S.tasks||[]).filter(task=>task.date===today);
  const tasksPct=todayTasks.length?Math.round(todayTasks.filter(task=>task.done).length/todayTasks.length*100):0;
  const mvdList=MVD_LISTS[S.dayType]||MVD_LISTS.normal;
  const mvdKey='mvd_'+S.dayType+'_'+today;
  const mvdDoneCount=(S.mvdDone&&S.mvdDone[mvdKey])?S.mvdDone[mvdKey].length:0;
  const mvdPct=mvdList.length?Math.round(mvdDoneCount/mvdList.length*100):0;
  const focusParts=[habitsPct,mvdPct];
  if(todayTasks.length)focusParts.push(tasksPct);
  const focusReadout=Math.round(focusParts.reduce((sum,value)=>sum+value,0)/Math.max(1,focusParts.length));
  const challengeRecord=typeof getWeekChallengeRecord==='function'?getWeekChallengeRecord():null;
  const challengeText=challengeRecord?(getChallengeText(challengeRecord.id)||challengeRecord.text):'لا يوجد تحدي أسبوعي بعد';
  const glyphs=[
    {label:'ARC // NULL', cls:'glyph-a'},
    {label:'VX-09', cls:'glyph-b'},
    {label:'MIRROR LOOP', cls:'glyph-c'},
    {label:'OMEGA TRACE', cls:'glyph-d'},
    {label:'NO SIGNAL', cls:'glyph-e'},
    {label:'PRISM FIELD', cls:'glyph-f'},
  ];
  return `<div class="page active cockpit-page" id="page-home">
  <canvas id="star-canvas" aria-hidden="true"></canvas>
  <div class="cockpit-cursor-glow" id="cockpit-cursor-glow" aria-hidden="true"></div>
  <div class="cockpit-warp-overlay" id="cockpit-warp-overlay" aria-hidden="true"></div>
  <div class="cockpit-scanner-line" aria-hidden="true"></div>
  <div class="cockpit-noise-layer" aria-hidden="true"></div>
  <div class="cockpit-light-grid" aria-hidden="true"></div>
  <div class="cockpit-corners" aria-hidden="true">
    <span class="cockpit-corner tl"></span>
    <span class="cockpit-corner tr"></span>
    <span class="cockpit-corner bl"></span>
    <span class="cockpit-corner br"></span>
  </div>
  <div class="cockpit-fx-layer" id="cockpit-fx-layer" aria-hidden="true"></div>
  <div class="cockpit-shell">
    <div class="cockpit-stage">
      <section class="cockpit-hero-stage">
        <div class="cockpit-kicker">Spectral Broadcast</div>
        <div class="page-title cockpit-greeting cockpit-glitch-title" id="home-greeting" data-text="مرحباً بكِ ✦">مرحباً بكِ ✦</div>
        <div class="page-subtitle cockpit-subtitle" id="home-sub">مركز التحكم الشخصي جاهز للتشغيل</div>
      </section>

      <section class="cockpit-core-stage">
        <div class="cockpit-core-shell">
          <div class="cockpit-core-rim rim-one" aria-hidden="true"></div>
          <div class="cockpit-core-rim rim-two" aria-hidden="true"></div>
          <div class="cockpit-core-rim rim-three" aria-hidden="true"></div>
          <div class="cockpit-core-grid" aria-hidden="true"></div>
          <div class="cockpit-energy-ripple ripple-one" aria-hidden="true"></div>
          <div class="cockpit-energy-ripple ripple-two" aria-hidden="true"></div>
          <div class="cockpit-energy-ripple ripple-three" aria-hidden="true"></div>

          <button class="cockpit-core-trigger" id="cockpit-core-trigger" type="button" onclick="triggerCockpitChaos('core')" aria-label="إطلاق الفوضى">
            <div class="cockpit-three-reticle" aria-hidden="true"></div>
            <div class="cockpit-three-shell">
              <div class="cockpit-three-aura aura-one" aria-hidden="true"></div>
              <div class="cockpit-three-aura aura-two" aria-hidden="true"></div>
              <div class="cockpit-three-wave wave-one" aria-hidden="true"></div>
              <div class="cockpit-three-wave wave-two" aria-hidden="true"></div>
              <div class="cockpit-three-wave wave-three" aria-hidden="true"></div>
              <div class="cockpit-three-container" id="cockpit-three-container" aria-hidden="true"></div>
            </div>
            <span class="cockpit-core-prompt" id="cockpit-core-prompt">اضغط لتفعيل النظام</span>
          </button>
        </div>
      </section>

    </div>
  </div>
</div>`;
}

function renderTasksPage(){
  return `<div class="page" id="page-tasks">
  <div class="page-header">
    <div class="page-header-row">
      <div>
        <div class="page-title">المهام اليومية</div>
        <div class="page-subtitle">ترتيب اليوم بشكل خفيف وواضح على طريقة Todoist</div>
      </div>
      <div class="page-tools"><div class="chip chip-gold" id="tasks-xp-mini">٠ XP اليوم</div></div>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="section-label">إضافة مهمة جديدة</div>
    <div class="task-form">
      <input class="inp" id="task-title-input" placeholder="اكتبي المهمة هنا..." style="flex:2;min-width:180px">
      <select class="inp" id="task-priority-select" style="flex:1;min-width:110px">
        <option value="normal">عادي</option>
        <option value="important">مهم</option>
        <option value="urgent">عاجل</option>
      </select>
      <select class="inp" id="task-repeat-select" style="flex:1;min-width:110px">
        <option value="none">لا</option>
        <option value="daily">يومي</option>
        <option value="weekly">أسبوعي</option>
      </select>
      <select class="inp" id="task-goal-select" style="flex:1;min-width:130px"></select>
      <button class="btn btn-primary" onclick="addTask()">إضافة مهمة</button>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="section-label">مهام اليوم</div>
      <div id="tasks-pending"></div>
    </div>
    <div class="card">
      <div class="section-label">المكتملة</div>
      <div id="tasks-completed"></div>
    </div>
  </div>
</div>`;
}

function renderHabitsPage(){
  return `<div class="page" id="page-habits">
  <div class="page-header">
    <div class="page-header-row">
      <div>
        <div class="page-title">العادات اليومية</div>
        <div class="page-subtitle">الاستمرارية أهم من الكمال — يوم بيوم</div>
      </div>
      <div class="page-tools">
        <button class="btn btn-ghost btn-sm" onclick="exportHabitsCsv()">⬇ تصدير CSV</button>
        <button class="btn btn-primary btn-sm" onclick="addHabitModal()">+ أضف عادة جديدة</button>
      </div>
    </div>
    <div class="habit-summary-strip" id="habits-summary"></div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div id="habits-list"></div>
  </div>
</div>`;
}

function renderMoneyPage(){
  return `<div class="page" id="page-money">
  <div class="page-header">
    <div class="page-header-row">
      <div>
        <div class="page-title">المصاريف والتحويش</div>
        <div class="page-subtitle">١٠٪ فورًا عند استلام الفلوس — القاعدة الذهبية</div>
      </div>
      <div class="page-tools">
        <select class="inp" id="money-currency-select" onchange="updateCurrency(this.value)" style="min-width:170px">
          ${renderCurrencyOptionsMarkup()}
        </select>
        <button class="btn btn-ghost btn-sm" onclick="exportExpensesCsv()">⬇ تصدير CSV</button>
      </div>
    </div>
  </div>
  <div class="grid-3" style="margin-bottom:16px">
    <div class="money-stat">
      <div class="ms-label">الرصيد المتاح</div>
      <div class="ms-val" id="m-balance">٠</div>
      <div class="ms-sub" id="money-balance-sub">${currencyShortName()} (دخل - مصاريف)</div>
      <div class="prog-wrap"><div class="prog-fill prog-green" id="m-balance-bar" style="width:0%"></div></div>
    </div>
    <div class="money-stat">
      <div class="ms-label">دخل الشهر</div>
      <div class="ms-val" id="m-income">٠</div>
      <div class="ms-sub" id="money-income-sub" style="color:var(--green)">${currencyShortName()} مكتسب</div>
      <div class="money-summary-row" style="margin-top:8px;cursor:pointer" onclick="openSavingsGoalModal()"><span style="color:var(--text3)">التحويش: <span id="m-savings-goal-val">٥٠٠٠</span> <span id="m-savings-goal-currency">${currencySymbol()}</span></span><span id="m-savings-wrap"><b id="m-savings-nav">٠ ${currencySymbol()}</b></span></div>
      <div class="prog-wrap"><div class="prog-fill prog-gold" id="m-savings-bar" style="width:0%"></div></div>
    </div>
    <div class="money-stat">
      <div class="ms-label">مصاريف الشهر</div>
      <div class="ms-val" id="m-total">٠</div>
      <div class="ms-sub" id="money-total-sub" style="color:var(--red)">${currencyShortName()} مصروف</div>
      <div class="money-cats" id="m-cats"></div>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="section-label">تسجيل عملية</div>
    <div class="money-form">
      <input type="number" class="inp" id="m-amount" placeholder="المبلغ (${currencySymbol()})" style="flex:1;min-width:100px">
      <select class="inp" id="m-cat" style="flex:1;min-width:120px">
        <optgroup label="الدخل">
          <option value="راتب">💼 راتب</option>
          <option value="مكافأة">🎁 مكافأة</option>
          <option value="دخل إضافي">💰 دخل إضافي</option>
        </optgroup>
        <optgroup label="المصروفات">
          <option value="أكل">🍽️ أكل</option>
          <option value="مواصلات">🚌 مواصلات</option>
          <option value="دراسة">📚 دراسة</option>
          <option value="ترفيه">🎮 ترفيه</option>
          <option value="صحة">💊 صحة</option>
          <option value="فواتير">🧾 فواتير</option>
          <option value="أخرى">📦 أخرى</option>
        </optgroup>
        <optgroup label="التحويش">
          <option value="ادخار">💚 ادخار</option>
        </optgroup>
      </select>
      <input type="text" class="inp" id="m-note" placeholder="ملاحظة" style="flex:2;min-width:120px">
      <button class="btn btn-primary" onclick="addExpense()">سجّل</button>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="section-label">الميزانية الشهرية (للمصاريف)</div>
    <div id="budget-list"></div>
    <div class="budget-projection" id="budget-projection"></div>
  </div>
  <div class="card">
    <div class="section-label">آخر المصروفات</div>
    <div class="exp-log" id="exp-log"><div class="exp-empty">لا توجد مصروفات بعد</div></div>
  </div>
</div>`;
}

function renderAnalyticsPage(){
  return `<div class="page" id="page-analytics">
  <div class="page-header">
    <div class="page-title">التحليلات</div>
    <div class="page-subtitle">نظرة ذكية على الطاقة والعادات والفلوس</div>
  </div>
  <div class="analytics-stack">
    <div class="card">
      <div class="section-label">أنماط الطاقة</div>
      <div class="energy-week-bars" id="energy-week-bars"></div>
    </div>
    <div class="card">
      <div class="section-label">مقارنة الأسبوع</div>
      <div class="week-compare-grid">
        <div class="compare-card"><div class="stat-label">هذا الأسبوع</div><div class="stat-value" id="analytics-this-week">٠٪</div></div>
        <div class="compare-card"><div class="stat-label">الأسبوع الماضي</div><div class="stat-value" id="analytics-last-week">٠٪</div></div>
        <div class="compare-card"><div class="stat-label">الاتجاه</div><div class="stat-value" id="analytics-week-trend">—</div><div class="stat-change" id="analytics-week-trend-sub">—</div></div>
      </div>
    </div>
    <div class="card">
      <div class="section-label">إحصائيات العادات</div>
      <div class="analytics-highlight-row">
        <div class="analytics-highlight"><span>أفضل عادة</span><strong id="analytics-best-habit">—</strong></div>
        <div class="analytics-highlight"><span>الأقل التزاماً</span><strong id="analytics-worst-habit">—</strong></div>
      </div>
      <div id="analytics-habit-rates"></div>
    </div>
    <div class="card">
      <div class="section-label">الاقتراحات الذكية</div>
      <div class="smart-suggestions" id="smart-suggestions"></div>
    </div>
  </div>
</div>`;
}

function renderProblemsPage(){
  return `<div class="page" id="page-problems">
  <div class="page-header">
    <div class="page-header-row">
      <div>
        <div class="page-title">إدارة المشاكل</div>
        <div class="page-subtitle">مشكلة محددة + حل + تجربة = تحسن ١٠٪ كل شهر</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openAddProblem()">+ مشكلة جديدة</button>
    </div>
  </div>
  <div id="problems-list"></div>
</div>`;
}

function renderGoalsPage(){
  return `<div class="page" id="page-goals">
  <div class="page-header">
    <div class="page-header-row">
      <div>
        <div class="page-title">أهداف ٣ شهور</div>
        <div class="page-subtitle">مش سنة — ٣ شهور بس. واضحة وقابلة للقياس</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openAddGoal()">+ هدف جديد</button>
    </div>
  </div>
  <div id="goals-list"></div>
</div>`;
}

function renderPomodoroPage(){
  return `<div class="page" id="page-pomodoro">
  <div class="page-header">
    <div class="page-title">مؤقت بومودورو</div>
    <div class="page-subtitle">٢٥ دقيقة تركيز، بعدها راحة قصيرة محسوبة</div>
  </div>
  <div class="timer-shell">
    <div class="timer-card">
      <div class="timer-state" id="pomodoro-state">جلسة تركيز</div>
      <div class="timer-display" id="pomodoro-display">25:00</div>
      <div class="timer-sub" id="pomodoro-sub">ابدئي جلسة تركيز واحدة فقط</div>
      <div class="timer-controls">
        <button class="btn btn-primary" onclick="togglePomodoro()" id="pomodoro-toggle-btn">ابدأ</button>
        <button class="btn btn-ghost" onclick="skipPomodoro()">تخطي</button>
        <button class="btn btn-ghost" onclick="resetPomodoro()">إعادة ضبط</button>
      </div>
      <div class="timer-presets">
        <button class="btn btn-ghost btn-sm" onclick="setPomodoroMode('focus')">٢٥ دقيقة تركيز</button>
        <button class="btn btn-ghost btn-sm" onclick="setPomodoroMode('break')">٥ دقائق راحة</button>
      </div>
    </div>
    <div class="timer-card">
      <div class="section-label">إحصائيات الجلسات</div>
      <div class="stats-row" style="margin-bottom:0">
        <div class="stat-card"><div class="stat-label">اليوم</div><div class="stat-value" id="pomodoro-today">٠</div><div class="stat-change stat-neutral">جلسة</div></div>
        <div class="stat-card"><div class="stat-label">الإجمالي</div><div class="stat-value" id="pomodoro-total">٠</div><div class="stat-change stat-neutral">منذ البداية</div></div>
        <div class="stat-card"><div class="stat-label">الوضع</div><div class="stat-value" id="pomodoro-mode-mini">تركيز</div><div class="stat-change stat-neutral">نشط الآن</div></div>
        <div class="stat-card"><div class="stat-label">الحالة</div><div class="stat-value" id="pomodoro-run-state">متوقف</div><div class="stat-change stat-neutral">جاهز</div></div>
      </div>
    </div>
  </div>
</div>`;
}

function renderWeeklyPage(){
  return `<div class="page" id="page-weekly">
  <div class="page-header">
    <div class="page-title">المراجعة الأسبوعية</div>
    <div class="page-subtitle">١٥ دقيقة في الأسبوع — السر الحقيقي للتطور</div>
  </div>
  <div class="card">
    <div class="weekly-q-block"><div class="wq-label"><span style="color:var(--green)">✓</span> إيه اللي نجح الأسبوع ده؟</div><textarea class="inp" id="wq1" placeholder="اكتبي اللي عملتيه صح..."></textarea></div>
    <div class="weekly-q-block"><div class="wq-label"><span style="color:var(--red)">✗</span> إيه اللي مجاش صح؟</div><textarea class="inp" id="wq2" placeholder="بدون جلد ذات — بس ملاحظة موضوعية..."></textarea></div>
    <div class="weekly-q-block"><div class="wq-label"><span style="color:var(--gold)">↻</span> إيه اللي هتغيريه الأسبوع الجاي؟</div><textarea class="inp" id="wq3" placeholder="تعديل واحد بس — مش قائمة أمنيات..."></textarea></div>
    <div class="weekly-q-block"><div class="wq-label"><span style="color:var(--blue)">✦</span> أهم درس الأسبوع</div><textarea class="inp" id="wq4" placeholder="حاجة تحبي تفتكريها..."></textarea></div>
    <div class="inline-actions">
      <button class="btn btn-primary" onclick="saveWeekly()">💾 احفظي المراجعة</button>
      <span id="weekly-saved-msg" style="font-size:12px;color:var(--green);display:none">✓ تم الحفظ</span>
    </div>
  </div>
  <div id="weekly-history" style="margin-top:20px"></div>
</div>`;
}

function renderJournalPage(){
  return `<div class="page" id="page-journal">
  <div class="page-header">
    <div class="page-header-row">
      <div>
        <div class="page-title">اليومية</div>
        <div class="page-subtitle">سجلي يومك، امتنانك، ومزاجك في مكان واحد</div>
      </div>
      <div class="page-tools"><div class="chip chip-gold" id="journal-energy-chip">الطاقة: ٥/١٠</div></div>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="section-label">مدخل اليوم</div>
    <div class="journal-mood-row" id="journal-mood-options"></div>
    <div class="journal-gratitude-grid">
      <input class="inp" id="journal-gratitude-1" placeholder="ممتنة لـ...">
      <input class="inp" id="journal-gratitude-2" placeholder="ممتنة لـ...">
      <input class="inp" id="journal-gratitude-3" placeholder="ممتنة لـ...">
    </div>
    <textarea class="inp" id="journal-content" placeholder="اكتبي عن يومك..." style="min-height:120px;margin-top:12px"></textarea>
    <div class="inline-actions" style="margin-top:12px">
      <button class="btn btn-primary" onclick="saveJournal()">احفظي اليومية</button>
      <span id="journal-saved-msg" style="font-size:12px;color:var(--green);display:none">✓ تم الحفظ</span>
    </div>
  </div>
  <div class="card">
    <div class="section-label">آخر ٧ أيام</div>
    <div id="journal-history"></div>
  </div>
</div>`;
}

function renderMoodPage(){
  return `<div class="page" id="page-mood">
  <div class="page-header">
    <div class="page-title">تتبع المزاج</div>
    <div class="page-subtitle">سجل يومي بسيط يوضح شكل أيامك مع الوقت</div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="section-label">مزاج اليوم</div>
    <div class="mood-grid" id="mood-options"></div>
    <div class="form-group" style="margin-top:14px">
      <label class="form-label">ملاحظة قصيرة</label>
      <textarea class="inp" id="mood-note" placeholder="اكتبي سبب مختصر أو ملاحظة عن اليوم"></textarea>
    </div>
    <div class="inline-actions">
      <button class="btn btn-primary" onclick="saveMood()">حفظ المزاج</button>
      <span id="mood-saved-msg" style="font-size:12px;color:var(--green);display:none">✓ تم الحفظ</span>
    </div>
  </div>
  <div class="card">
    <div class="section-label">السجل الأخير</div>
    <div class="mood-history" id="mood-history"></div>
  </div>
</div>`;
}

function renderTipsPage(){
  return `<div class="page" id="page-tips">
  <div class="page-header">
    <div class="page-title">مكتبة النصائح ✦</div>
    <div class="page-subtitle">نصائح علمية ومجربة لكل المشاكل اللي بتواجهيها</div>
  </div>
  <div class="tips-filter" id="tips-filter">
    <button class="tip-cat-btn active" onclick="filterTips(this,'all')">الكل</button>
    <button class="tip-cat-btn" onclick="filterTips(this,'energy')">الطاقة والنوم</button>
    <button class="tip-cat-btn" onclick="filterTips(this,'focus')">التركيز والمذاكرة</button>
    <button class="tip-cat-btn" onclick="filterTips(this,'money')">الفلوس</button>
    <button class="tip-cat-btn" onclick="filterTips(this,'develop')">التطوير الذاتي</button>
    <button class="tip-cat-btn" onclick="filterTips(this,'social')">الحياة الاجتماعية</button>
    <button class="tip-cat-btn" onclick="filterTips(this,'spirit')">الروحانيات</button>
    <button class="tip-cat-btn" onclick="filterTips(this,'expat')">الغربة</button>
  </div>
  <div id="tips-list"></div>
</div>`;
}

function renderAchievementsPage(){
  return `<div class="page" id="page-achievements">
  <div class="page-header">
    <div class="page-title">الإنجازات</div>
    <div class="page-subtitle">XP، المستوى، الشارات، والتحدي الأسبوعي</div>
  </div>
  <div class="achievements-stack">
    <div class="card">
      <div class="section-label">ملخص المستوى</div>
      <div class="xp-overview-grid">
        <div class="stat-card"><div class="stat-label">المستوى الحالي</div><div class="stat-value" id="achievement-level">١</div></div>
        <div class="stat-card"><div class="stat-label">إجمالي XP</div><div class="stat-value" id="achievement-xp">٠</div></div>
        <div class="stat-card"><div class="stat-label">للمستوى التالي</div><div class="stat-value" id="achievement-next">٢٠٠</div></div>
      </div>
      <div class="prog-wrap" style="margin-top:14px"><div class="prog-fill prog-gold" id="achievement-xp-bar" style="width:0%"></div></div>
    </div>
    <div class="card">
      <div class="section-label">التحدي الأسبوعي</div>
      <div class="challenge-card">
        <div class="challenge-title" id="weekly-challenge-title">لا يوجد تحدي بعد</div>
        <div class="challenge-meta" id="weekly-challenge-meta">انتظري التحدي القادم</div>
        <div class="prog-wrap" style="margin-top:12px"><div class="prog-fill prog-green" id="weekly-challenge-bar" style="width:0%"></div></div>
      </div>
    </div>
    <div class="badge-grid" id="achievements-list"></div>
  </div>
</div>`;
}

function renderGuidePage(){
  return `<div class="page" id="page-guide">
  <div class="page-header">
    <div class="page-title">دليل التطور 💡</div>
    <div class="page-subtitle">كيف تستخدمين Personal Tracker لتحقيق أقصى استفادة وبناء حياة متوازنة؟</div>
  </div>
  <div class="tips-list">
    
    <div class="tip-card" style="margin-bottom:12px; border: 1px solid var(--gold-dim2)">
      <div class="tip-card-top">
        <div class="tip-icon-box" style="background:var(--gold-dim);color:var(--gold)">⬡</div>
        <div style="flex:1">
          <div class="tip-cat">البداية</div>
          <div class="tip-title">لوحة القيادة (Dashboard)</div>
        </div>
      </div>
      <div class="tip-body">
        لوحة القيادة هي نبض يومك. نظرة سريعة عليها تخبرك بكل شيء: طاقتك الحالية، نسبة المهام المنجزة، والالتزام בעادات. 
        <br><br><b>نصيحة:</b> ابدأي يومك بفتح هذه الصفحة لضبط نيتك وتحديد "الحد الأدنى" (MVD) الذي يجب إنجازه مهما كان اليوم سيئاً.
      </div>
    </div>

    <div class="tip-card" style="margin-bottom:12px">
      <div class="tip-card-top">
        <div class="tip-icon-box">◎</div>
        <div style="flex:1">
          <div class="tip-cat">الاستمرارية</div>
          <div class="tip-title">العادات (Habits) مقابل المهام (Tasks)</div>
        </div>
      </div>
      <div class="tip-body">
        <b>العادات:</b> هي الأفعال التي تبني الهوية، مثل الصلاة، الرياضة، أو القراءة المستمرة. الهدف هنا هو "عدم كسر السلسلة" (Streak). التزمي بالقليل المستمر.<br><br>
        <b>المهام:</b> هي أهداف يومية متغيرة تدفع مشاريعك أو واجباتك للأمام. المهام تُنجز وتُنسى، أما العادات فتُبنى لتستمر.
      </div>
    </div>

    <div class="tip-card" style="margin-bottom:12px">
      <div class="tip-card-top">
        <div class="tip-icon-box">◈</div>
        <div style="flex:1">
          <div class="tip-cat">الوعي المالي</div>
          <div class="tip-title">الفلوس والتحويش</div>
        </div>
      </div>
      <div class="tip-body">
        الوعي المالي يبدأ بالتسجيل. لا يهم حجم المصروف، المهم أن تعرفي أين تذهب أموالك.
        <br><b>القاعدة الذهبية:</b> بمجرد دخول أي مبلغ لكِ، اسحبي فوراً نسبة (مثلاً 10%) إلى فئة "ادخار" قبل أن تصرفي قرشاً واحداً. النظام هنا مجهز لتتبع هذا الهدف وتشجيعك على الوصول للهدف الكلي.
      </div>
    </div>

    <div class="tip-card" style="margin-bottom:12px">
      <div class="tip-card-top">
        <div class="tip-icon-box">◫</div>
        <div style="flex:1">
          <div class="tip-cat">عقلية النمو</div>
          <div class="tip-title">إدارة المشاكل (Problem Management)</div>
        </div>
      </div>
      <div class="tip-body">
        بدلاً من الشكوى المستمرة من نفس المشكلة (مثل: نومي ملخبط)، تعاملي معها كمهندسة:
        <ul style="margin:8px 0 0 20px;padding:0">
          <li style="margin-bottom:6px"><b>حددي المشكلة:</b> نوم غير منتظم.</li>
          <li style="margin-bottom:6px"><b>الحل المقترح (للتجربة):</b> قراءة كتاب بدل الموبايل قبل النوم بـ 30 دقيقة.</li>
          <li style="margin-bottom:6px"><b>المدة:</b> جربي الحل لـ 7 أيام بصدق والتزمي به كأنه دواء. نجح؟ انقليه لـ "محلولة". لم ينجح؟ غيري الحل المقترح.</li>
        </ul>
      </div>
    </div>

    <div class="tip-card" style="margin-bottom:12px">
      <div class="tip-card-top">
        <div class="tip-icon-box">📝</div>
        <div style="flex:1">
          <div class="tip-cat">الصحة النفسية</div>
          <div class="tip-title">اليومية (Journaling) والامتنان</div>
        </div>
      </div>
      <div class="tip-body">
        لا تتركي أفكارك تدور في رأسك. فرغيها.
        <br>دقيقة واحدة يومياً تكتبي فيها 3 أشياء بسيطة أنتِ ممتنة عليها (حتى لو كانت فنجان قهوة مظبوط) قادرة على إعادة برمجة تركيز العقل نحو الإيجابيات بدلاً من السلبيات.
      </div>
    </div>

    <div class="tip-card" style="margin-bottom:12px">
      <div class="tip-card-top">
        <div class="tip-icon-box">◬</div>
        <div style="flex:1">
          <div class="tip-cat">الاتجاه الصحيح</div>
          <div class="tip-title">الأهداف والمراجعة الأسبوعية</div>
        </div>
      </div>
      <div class="tip-body">
        <b>الأهداف:</b> لا تضعي أهدافاً سنوية. ضعي 3 أهداف واضحة لـ 3 شهور القادمة فقط. هذا يخلق إحساساً بالاستعجال ويمنع التسويف.<br><br>
        <b>المراجعة الأسبوعية:</b> 15 دقيقة نهاية كل أسبوع تسألين نفسك بصدق: إيه اللي نفع؟ وإيه اللي مانفعش؟ وايه التعديل البسيط اللي هضيفه الأسبوع الجاي؟ هذه هي الطريقة الوحيدة لضمان عدم تكرار أخطاء الأسبوع الماضي.
      </div>
    </div>

  </div>
</div>`;
}

function renderSettingsPage(){
  return `<div class="page" id="page-settings">
  <div class="page-header">
    <div class="page-title">الإعدادات</div>
    <div class="page-subtitle">تحكم في شكل التطبيق والنسخ الاحتياطي والتصدير</div>
  </div>
  <div class="settings-stack">
    <div class="card">
      <div class="section-label">الواجهة</div>
      <div class="setting-row">
        <div class="setting-copy">
          <div class="setting-title">حجم الخط</div>
          <div class="setting-desc">كبّري أو صغّري الواجهة حسب راحتك</div>
        </div>
        <div style="width:min(240px,100%)">
          <input type="range" class="goal-slider" min="0.9" max="1.2" step="0.05" id="font-scale-range" oninput="updateFontScale(this.value)">
          <div style="font-size:11px;color:var(--text2);margin-top:6px;text-align:left" id="font-scale-label">100%</div>
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-copy">
          <div class="setting-title">اللغة</div>
          <div class="setting-desc">تبديل لغة الواجهة الأساسية</div>
        </div>
        <select class="inp" style="max-width:180px" id="language-select" onchange="updateLanguage(this.value)">
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
    <div class="card">
      <div class="section-label">التصدير والنسخ الاحتياطي</div>
      <div class="backup-actions">
        <button class="btn btn-primary" onclick="exportStateJson()">⬇ تصدير JSON</button>
        <button class="btn btn-ghost" onclick="triggerJsonImport()">⬆ استيراد JSON</button>
        <button class="btn btn-ghost" onclick="exportExpensesCsv()">CSV المصاريف</button>
        <button class="btn btn-ghost" onclick="exportHabitsCsv()">CSV العادات</button>
      </div>
      <input type="file" class="hidden-input" id="json-import-input" accept="application/json" onchange="handleJsonImport(event)">
    </div>
  </div>
</div>`;
}

function renderPages(){
  return [
    renderHomePage(),
    renderTasksPage(),
    renderHabitsPage(),
    renderMoneyPage(),
    renderAnalyticsPage(),
    renderProblemsPage(),
    renderGoalsPage(),
    renderPomodoroPage(),
    renderWeeklyPage(),
    renderJournalPage(),
    renderMoodPage(),
    renderTipsPage(),
    renderGuidePage(),
    renderAchievementsPage(),
    renderSettingsPage(),
  ].join('');
}

function renderShellOverlays(){
  return `<div class="modal-overlay" id="modal-overlay" onclick="closeModal(event)">
  <div class="modal" id="modal-box">
    <div class="modal-title" id="modal-title"></div>
    <div id="modal-body"></div>
    <div class="modal-btns" id="modal-btns"></div>
  </div>
</div>
<div class="toast" id="toast"></div>
<div class="xp-toast" id="xp-toast"></div>
<div class="loading-overlay" id="app-loading">
  <div class="loading-box">
    <div class="loading-spinner"></div>
    <div class="loading-title">جاري تحميل البيانات...</div>
    <div class="loading-sub">Syncing with MongoDB Atlas</div>
  </div>
</div>`;
}

function renderAppShell(){
  const root=document.getElementById('app-root');
  if(!root)return;
  const sidebarCollapsed=localStorage.getItem('sama_sidebar_collapsed')==='1';
  const sidebarHidden=localStorage.getItem('sama_sidebar_hidden')==='1';
  root.innerHTML=`<div class="app ${sidebarCollapsed?'sidebar-collapsed':''} ${sidebarHidden?'sidebar-hidden':''}">${renderDesktopSidebar()}<main class="main">${renderMobileShell()}${renderPages()}</main></div>${renderShellOverlays()}`;
}
