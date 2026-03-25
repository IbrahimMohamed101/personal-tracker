// Shared UI actions, settings, export/import, navigation, and modal helpers.

function renderLoginScreen(root) {
  const overlays = typeof renderShellOverlays === 'function' ? renderShellOverlays() : '';
  const apiConfig = typeof renderAuthApiConfig === 'function' ? renderAuthApiConfig() : '';
  root.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
           <h1 class="logo-text">Personal Tracker</h1>
           <p class="auth-subtitle">منظمك الشخصي المتكامل</p>
        </div>
        ${apiConfig}
        <div id="auth-form-container">
           ${getLoginFormHtml()}
        </div>
      </div>
    </div>
    ${overlays}
  `;
  setLoadingVisible(false);
}

function renderAuthApiConfig() {
  if (typeof isStaticOnlyHost !== 'function' || !isStaticOnlyHost()) return '';

  const storedValue = localStorage.getItem('sama_api_url') || '';
  const label = lang() === 'en' ? 'Backend URL' : 'رابط الـ Backend';
  const placeholder = 'https://your-backend.example.com/api';
  const saveLabel = lang() === 'en' ? 'Save Backend URL' : 'حفظ رابط الـ Backend';
  const clearLabel = lang() === 'en' ? 'Clear' : 'مسح';
  const hint = shouldPromptForApiConfiguration()
    ? missingApiConfigurationMessage()
    : (lang() === 'en' ? `Current backend: ${API_URL}` : `الـ Backend الحالي: ${API_URL}`);

  return `
    <div class="auth-api-config">
      <div class="auth-api-title">${label}</div>
      <p class="auth-api-hint">${escapeHtml(hint)}</p>
      <p class="auth-api-help">${escapeHtml(apiConfigurationHelpText())}</p>
      <div class="input-group">
        <input type="url" id="auth-api-url" value="${escapeHtml(storedValue)}" placeholder="${placeholder}" dir="ltr" inputmode="url">
      </div>
      <div class="auth-api-actions">
        <button type="button" class="btn btn-primary auth-api-btn" onclick="saveAuthApiUrl()">${saveLabel}</button>
        <button type="button" class="btn btn-ghost auth-api-btn" onclick="clearAuthApiUrl()">${clearLabel}</button>
      </div>
    </div>
  `;
}

function saveAuthApiUrl() {
  const input = document.getElementById('auth-api-url');
  if (!input) return;
  try {
    saveApiUrlConfiguration(input.value);
    window.location.reload();
  } catch (err) {
    toast(err.message, 3500);
  }
}

function clearAuthApiUrl() {
  clearApiUrlConfiguration();
  window.location.reload();
}

function validateAuthFields(username, password) {
  const normalizedUsername = String(username || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedUsername) {
    throw new Error(lang() === 'en' ? 'Username is required' : 'اسم المستخدم مطلوب');
  }

  if (normalizedUsername.length < 3) {
    throw new Error(lang() === 'en' ? 'Username must be at least 3 characters' : 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
  }

  if (!normalizedPassword) {
    throw new Error(lang() === 'en' ? 'Password is required' : 'كلمة المرور مطلوبة');
  }

  if (normalizedPassword.length < 6) {
    throw new Error(lang() === 'en' ? 'Password must be at least 6 characters' : 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
  }

  return { username: normalizedUsername, password: normalizedPassword };
}

function getLoginFormHtml() {
  return `
    <form onsubmit="handleLogin(event)" class="auth-form">
      <div class="input-group">
        <label>اسم المستخدم</label>
        <input type="text" id="auth-username" required minlength="3" maxlength="40" autocomplete="username" placeholder="ادخلي اسم المستخدم">
      </div>
      <div class="input-group">
        <label>كلمة المرور</label>
        <input type="password" id="auth-password" required minlength="6" autocomplete="current-password" placeholder="••••••••">
      </div>
      <button type="submit" class="btn btn-primary auth-btn">تسجيل الدخول</button>
      <p class="auth-switch">ليس لديكِ حساب؟ <a href="#" onclick="showRegister(event)">إنشاء حساب جديد</a></p>
    </form>
  `;
}

function getRegisterFormHtml() {
  return `
    <form onsubmit="handleRegister(event)" class="auth-form">
      <div class="input-group">
        <label>اسم المستخدم</label>
        <input type="text" id="auth-username" required minlength="3" maxlength="40" autocomplete="username" placeholder="اختاري اسم مستخدم">
      </div>
      <div class="input-group">
        <label>كلمة المرور</label>
        <input type="password" id="auth-password" required minlength="6" autocomplete="new-password" placeholder="••••••••">
      </div>
      <div class="input-group">
        <label>تأكيد كلمة المرور</label>
        <input type="password" id="auth-confirm-password" required minlength="6" autocomplete="new-password" placeholder="••••••••">
      </div>
      <button type="submit" class="btn btn-primary auth-btn">إنشاء الحساب</button>
      <p class="auth-switch">لديكِ حساب بالفعل؟ <a href="#" onclick="showLogin(event)">تسجيل الدخول</a></p>
    </form>
  `;
}

function showLogin(e) {
  if (e) e.preventDefault();
  document.getElementById('auth-form-container').innerHTML = getLoginFormHtml();
}

function showRegister(e) {
  if (e) e.preventDefault();
  document.getElementById('auth-form-container').innerHTML = getRegisterFormHtml();
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    const { username, password } = validateAuthFields(
      document.getElementById('auth-username').value,
      document.getElementById('auth-password').value
    );
    setLoadingVisible(true);
    await loginUser(username, password);
  } catch (err) {
    toast(err.message, 3000);
  } finally {
    setLoadingVisible(false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  let credentials;
  try {
    credentials = validateAuthFields(
      document.getElementById('auth-username').value,
      document.getElementById('auth-password').value
    );
  } catch (err) {
    toast(err.message, 3000);
    return;
  }

  const { username, password } = credentials;
  const cp = document.getElementById('auth-confirm-password').value;
  if (password !== cp) return toast('كلمات المرور غير متوافقة');
  try {
    setLoadingVisible(true);
    await registerUser(username, password);
  } catch (err) {
    toast(err.message, 3000);
  } finally {
    setLoadingVisible(false);
  }
}
function downloadFile(filename,content,type){
  const blob=new Blob([content],{type});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function exportStateJson(){
  downloadFile(`sama-backup-${todayKey()}.json`,JSON.stringify({...S,exportedAt:new Date().toISOString()},null,2),'application/json;charset=utf-8');
  toast(lang()==='en'?'Backup exported':'تم تصدير النسخة الاحتياطية');
}

function triggerJsonImport(){
  const input=document.getElementById('json-import-input');
  if(input){
    input.value='';
    input.click();
  }
}

function handleJsonImport(event){
  const file=event.target.files&&event.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(String(reader.result||'{}'));
      S=normalizeStateShape(parsed);
      selectedMood=null;
      selectedJournalMood=null;
      applySettings();
      renderActivePage();
      save();
      toast(lang()==='en'?'Backup imported':'تم استيراد النسخة بنجاح');
    }catch(err){
      console.warn('Import failed',err);
      toast(lang()==='en'?'Import failed':'فشل استيراد الملف');
    }
  };
  reader.readAsText(file,'utf-8');
}

function currentSyncState(){
  const el=document.getElementById('sync-indicator');
  if(!el)return 'syncing';
  if(el.classList.contains('synced'))return 'synced';
  if(el.classList.contains('offline'))return 'offline';
  return 'syncing';
}

function applySettings(){
  const settings=S.settings||createDefaultState().settings;
  document.documentElement.style.setProperty('--font-scale',settings.fontScale);
  document.documentElement.lang=settings.language;
  document.documentElement.dir=settings.language==='en'?'ltr':'rtl';
  document.title=settings.language==='en'?'Personal Tracker - Personal System':'Personal Tracker — منظمك الشخصي';

  const fontRange=document.getElementById('font-scale-range');
  const fontLabel=document.getElementById('font-scale-label');
  if(fontRange)fontRange.value=String(settings.fontScale);
  if(fontLabel)fontLabel.textContent=`${Math.round(settings.fontScale*100)}%`;
  const languageSelect=document.getElementById('language-select');
  if(languageSelect)languageSelect.value=settings.language;

  const desktopLabels={home:'⬡',tasks:'✅',habits:'◎',money:'◈',problems:'◫',journal:'📝',mood:'◍',analytics:'📊',goals:'◬',weekly:'◧',pomodoro:'◴',achievements:'🏆',tips:'✦',settings:'⚙'};
  Object.keys(desktopLabels).forEach(page=>{
    const nav=document.querySelector(`.nav-item[data-page="${page}"]`);
    if(nav){
      const label=langText(`nav.${page}`,page);
      nav.innerHTML=`<span class="nav-icon">${desktopLabels[page]}</span> ${label}${page==='tips'?' <span class="nav-badge">١٢</span>':''}`;
    }
    const mobile=document.querySelector(`.mobile-nav-btn[data-page="${page}"]`);
    if(mobile){
      mobile.innerHTML=`<span class="mobile-nav-icon">${desktopLabels[page]}</span><span>${langText(`mobileNav.${page}`,page)}</span>`;
    }
  });

  const dayTypeText={
    ar:{normal:'🌙 يوم عادي',lecture:'🦷 محاضرة',restaurant:'🍽️ مطعم',nightshift:'🌃 شغل ليلي',ramadan:'☪️ رمضان',offday:'🌤️ يوم عطلة',weekend:'🛋️ weekend'},
    en:{normal:'🌙 Normal Day',lecture:'🦷 Lecture',restaurant:'🍽️ Restaurant',nightshift:'🌃 Night Shift',ramadan:'☪️ Ramadan',offday:'🌤️ Day Off',weekend:'🛋️ Weekend'},
  };
  document.querySelectorAll('.dt-btn').forEach(btn=>{
    const type=btn.getAttribute('data-type');
    btn.textContent=dayTypeText[settings.language][type]||btn.textContent;
  });

  const buttonMap=[
    ['button[onclick="saveWeekly()"]','buttons.saveWeekly'],
    ['button[onclick="saveMood()"]','buttons.saveMood'],
    ['button[onclick="saveJournal()"]','buttons.saveJournal'],
    ['button[onclick="addHabitModal()"]','buttons.addHabit'],
    ['button[onclick="openAddGoal()"]','buttons.addGoal'],
    ['button[onclick="openAddProblem()"]','buttons.addProblem'],
    ['button[onclick="addTask()"]','buttons.addTask'],
    ['button[onclick="addExpense()"]','buttons.logExpense'],
  ];
  buttonMap.forEach(([selector,key])=>{
    document.querySelectorAll(selector).forEach(btn=>{btn.textContent=langText(key,btn.textContent);});
  });

  const pageText={
    ar:{
      habits:['العادات اليومية','الاستمرارية أهم من الكمال — يوم بيوم'],
      tasks:['المهام اليومية','رتبي يومك بوضوح: مهم، عاجل، ومتكرر'],
      money:['المصاريف والتحويش','١٠٪ فورًا عند استلام الفلوس — القاعدة الذهبية'],
      problems:['إدارة المشاكل','مشكلة محددة + حل + تجربة = تحسن ١٠٪ كل شهر'],
      journal:['اليومية','سجلي اليوم، الامتنان، والمزاج في مكان واحد'],
      mood:['تتبع المزاج','سجل يومي بسيط يوضح شكل أيامك مع الوقت'],
      analytics:['التحليلات','نظرة واضحة على العادات والمصاريف والمزاج'],
      goals:['أهداف ٣ شهور','مش سنة — ٣ شهور بس. واضحة وقابلة للقياس'],
      pomodoro:['مؤقت بومودورو','٢٥ دقيقة تركيز، بعدها راحة قصيرة محسوبة'],
      weekly:['المراجعة الأسبوعية','١٥ دقيقة في الأسبوع — السر الحقيقي للتطور'],
      achievements:['الإنجازات','شارات صغيرة تذكّرك أن التقدم الحقيقي بيحصل'],
      tips:['مكتبة النصائح ✦','نصائح علمية ومجربة لكل المشاكل اللي بتواجهيها'],
      settings:['الإعدادات','تحكم في شكل التطبيق والنسخ الاحتياطي والتصدير'],
    },
    en:{
      habits:['Daily Habits','Consistency matters more than perfection'],
      tasks:['Daily Tasks','Keep today clear, light, and actionable'],
      money:['Money & Savings','Save 10% first, always'],
      problems:['Problem Tracker','A clear issue + a tested solution = real progress'],
      journal:['Journal','Capture your day, gratitude, and mood in one place'],
      mood:['Mood Tracker','A simple daily log for how your days feel'],
      analytics:['Analytics','A clear view of habits, spending, and mood'],
      goals:['90-Day Goals','Short cycles, clear targets, measurable progress'],
      pomodoro:['Pomodoro Timer','25 minutes focus, then a short break'],
      weekly:['Weekly Review','15 minutes each week makes the difference'],
      achievements:['Achievements','Small badges that prove progress is real'],
      tips:['Tips Library ✦','Practical guidance for your recurring challenges'],
      settings:['Settings','Interface controls, backups, and exports'],
    },
  };
  Object.entries(pageText[settings.language]).forEach(([page,texts])=>{
    const title=document.querySelector(`#page-${page} .page-title`);
    const subtitle=document.querySelector(`#page-${page} .page-subtitle`);
    if(title)title.textContent=texts[0];
    if(subtitle)subtitle.textContent=texts[1];
  });

  const toggleBtn=document.getElementById('pomodoro-toggle-btn');
  if(toggleBtn)toggleBtn.textContent=S.pomodoro.running?langText('buttons.pause','إيقاف'):langText('buttons.start','ابدأ');
  setSyncIndicator(currentSyncState());
  renderXpUi();
  updateClock();
  applyGreeting();
}

function updateFontScale(value){
  S.settings.fontScale=Math.min(1.2,Math.max(0.9,Number(value)||1));
  applySettings();
  save();
}

function updateLanguage(value){
  S.settings.language=['ar','en'].includes(value)?value:'ar';
  applySettings();
  renderActivePage();
  save();
}

let toastTimerId=null;
function ensureToastElement(){
  let toastEl=document.getElementById('toast');
  if(toastEl)return toastEl;
  toastEl=document.createElement('div');
  toastEl.id='toast';
  toastEl.className='toast';
  document.body.appendChild(toastEl);
  return toastEl;
}
function toast(msg,dur=2200){
  const toastEl=ensureToastElement();
  toastEl.textContent=String(msg??'');
  toastEl.classList.add('show');
  if(toastTimerId)clearTimeout(toastTimerId);
  toastTimerId=setTimeout(()=>{
    toastEl.classList.remove('show');
    toastTimerId=null;
  },dur);
}

function syncPageNav(id){
  document.querySelectorAll('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===id));
}

function goPage(id){
  const page=document.getElementById('page-'+id);
  if(!page)return;
  if(id!=='home'){
    const app=document.querySelector('.app');
    if(app)app.classList.remove('sidebar-hidden');
    localStorage.removeItem('sama_sidebar_hidden');
  }
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  page.classList.add('active');
  syncPageNav(id);
  const main=document.querySelector('.main');
  if(main)main.scrollTop=0;
  if(id==='tasks')renderTasks();
  if(id==='habits')renderHabits();
  if(id==='money')renderMoney();
  if(id==='problems')renderProblems();
  if(id==='journal')renderJournal();
  if(id==='mood')renderMood();
  if(id==='analytics')renderAnalytics();
  if(id==='goals')renderGoals();
  if(id==='pomodoro')renderPomodoro();
  if(id==='weekly')loadWeekly();
  if(id==='achievements')renderAchievements();
  if(id==='tips')renderTips('all');
  if(id==='settings')renderSettings();
  if(id==='home')renderHome();
}

function setEnergy(v,persist=true){
  const energyValue=parseInt(v,10);
  S.energy=energyValue;
  if(!Array.isArray(S.energyHistory))S.energyHistory=[];
  const today=todayKey();
  const existing=S.energyHistory.find(entry=>entry.date===today);
  if(existing)existing.value=energyValue;
  else S.energyHistory.unshift({date:today,value:energyValue});
  const energyNum=document.getElementById('ew-num');
  const energyDesc=document.getElementById('ew-desc');
  const mobileEnergy=document.getElementById('m-energy-mini');
  if(energyNum)energyNum.textContent=toAr(energyValue);
  if(energyDesc)energyDesc.textContent=ENERGY_DESC[energyValue]||'';
  if(mobileEnergy)mobileEnergy.textContent=`${toAr(energyValue)}/١٠`;
  const energyChip=document.getElementById('journal-energy-chip');
  if(energyChip)energyChip.textContent=`الطاقة: ${toAr(energyValue)}/١٠`;
  const active=document.querySelector('.page.active');
  if(active&&active.id==='page-analytics')renderAnalytics();
  if(active&&active.id==='page-journal')renderJournal();
  if(active&&active.id==='page-home'&&typeof window.dashboardCockpitRefresh==='function')window.dashboardCockpitRefresh({boost:false});
  if(persist)save({delay:ENERGY_SYNC_DELAY_MS});
}

function updateClock(){
  const dateText=todayStr();
  const timeText=timeStr();
  const dateEl=document.getElementById('s-date');
  const timeEl=document.getElementById('s-time');
  const mobileDateEl=document.getElementById('m-date');
  const mobileTimeEl=document.getElementById('m-time');
  if(dateEl)dateEl.textContent=dateText;
  if(timeEl)timeEl.textContent=timeText;
  if(mobileDateEl)mobileDateEl.textContent=dateText;
  if(mobileTimeEl)mobileTimeEl.textContent=timeText;
}

function renderSettings(){
  applySettings();
}

function openModal(title,bodyHtml,btns){
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=bodyHtml;
  document.getElementById('modal-btns').innerHTML=btns.map(btn=>{
    const handler=String(btn.fn).includes('(')?btn.fn:`${btn.fn}()`;
    return `<button class="btn ${btn.primary?'btn-primary':'btn-ghost'}" onclick="${handler}">${btn.text}</button>`;
  }).join('');
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal(e){
  if(!e||e.target===document.getElementById('modal-overlay')){
    document.getElementById('modal-overlay').classList.remove('open');
  }
}

// Counter animation for numbers
const animateCounter = (element, target, duration = 800) => {
  const start = performance.now();
  const startVal = 0;
  
  const cleanTarget = (typeof target === 'string') ? parseInt(target.replace(/[^\d]/g, '') || 0) : target;
  if(isNaN(cleanTarget)) { element.textContent = target; return; }

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (cleanTarget - startVal) * eased);
    
    element.textContent = current; 
    
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
};

// Particle burst for achievements / unlocks
window.particleBurst = (element) => {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position:fixed; width:5px; height:5px; border-radius:50%;
      background:var(--gold); pointer-events:none; z-index:9999;
      left:${centerX}px; top:${centerY}px;
    `;
    
    const angle = (i / 8) * Math.PI * 2;
    const distance = 40 + Math.random() * 20;
    
    particle.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle)*distance}px), calc(-50% + ${Math.sin(angle)*distance}px)) scale(0)`, opacity: 0 }
    ], { duration: 600, easing: 'cubic-bezier(0,0,0.2,1)', fill: 'forwards' });
    
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 650);
  }
};

// Level up flash
window.levelUpFlash = () => {
    const flash = document.createElement('div');
    flash.className = 'level-up-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 200);
}

// UI touch flash for mobile
document.addEventListener('touchstart', (e) => {
  const btn = e.target.closest('button, .nav-item, .card, .habit-day');
  if(btn) btn.classList.add('touch-active');
}, {passive: true});
document.addEventListener('touchend', () => {
  document.querySelectorAll('.touch-active').forEach(el => el.classList.remove('touch-active'));
}, {passive: true});

// Enhance existing goPage() function for fluid transitions
const originalGoPage = window.goPage || goPage; 
window.goPage = (pageId) => {
  const activePage = document.querySelector('.page.active') || document.querySelector('main > div:not(.hidden)');
  const targetPage = document.getElementById('page-' + pageId);
  
  if(activePage && targetPage && activePage !== targetPage && !activePage.classList.contains('page-exit')) {
    activePage.classList.add('page-exit');
    
    setTimeout(() => {
      activePage.classList.remove('active', 'page-exit');
      targetPage.classList.add('active', 'page-enter');
      originalGoPage(pageId); // actually render new content
      
      const staggerItems = targetPage.querySelectorAll('.card, .mvd-task, .stat-card, .goal-card, .problem-card, .tip-card');
      staggerItems.forEach((el, i) => {
        el.classList.add('stagger-item');
        el.style.animationDelay = `${i * 0.05}s`;
      });
      
      const statNums = targetPage.querySelectorAll('.stat-num, .ms-val, .goal-pct-num, .ew-num');
      statNums.forEach(num => animateCounter(num, num.getAttribute('data-val') || num.textContent));
      
      // Habits load animation
      if (pageId === 'habits') {
        const dots = targetPage.querySelectorAll('.habit-day:not(.rendered)');
        dots.forEach((dot, index) => {
          dot.classList.add('rendered');
          dot.style.opacity = '0';
          dot.style.transform = 'scale(0)';
          dot.animate([
            { opacity: 0, transform: 'scale(0)' },
            { opacity: 1, transform: 'scale(1)' }
          ], {
            duration: 300,
            delay: index * 20, /* 20ms sequential fill */
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'forwards'
          });
        });
      }

      setTimeout(() => targetPage.classList.remove('page-enter'), 300);
    }, 150);
  } else if (!activePage || activePage === targetPage) {
     originalGoPage(pageId);
  }
};
goPage = window.goPage;
