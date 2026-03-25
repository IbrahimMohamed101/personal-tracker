function normalizeApiUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  const normalized = trimmed.replace(/\/+$/, '');
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
}

function readMetaApiUrl() {
  const meta = document.querySelector('meta[name="sama-api-url"]');
  return meta ? meta.getAttribute('content') : '';
}

function readQueryApiUrl() {
  const params = new URLSearchParams(window.location.search);
  const rawValue = params.get('api_url');
  if (!rawValue) return null;

  const normalized = normalizeApiUrl(rawValue);
  if (normalized) {
    localStorage.setItem('sama_api_url', normalized);
  }

  params.delete('api_url');
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', nextUrl);

  return normalized;
}

function isStaticOnlyHost() {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.endsWith('.netlify.app')
    || hostname.endsWith('.vercel.app')
    || hostname.endsWith('.github.io');
}

function getConfiguredApiUrl() {
  return readQueryApiUrl()
    || normalizeApiUrl(window.SAMA_API_URL)
    || normalizeApiUrl(readMetaApiUrl())
    || normalizeApiUrl(localStorage.getItem('sama_api_url'));
}

function resolveApiUrl() {
  const configuredUrl = getConfiguredApiUrl();
  if (configuredUrl) return configuredUrl;

  const { protocol, hostname, port, origin } = window.location;
  const normalizedHost = hostname === '0.0.0.0' ? 'localhost' : hostname;
  const isHttp = protocol === 'http:' || protocol === 'https:';
  const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);

  if (!isHttp) return 'http://localhost:5000/api';
  if (port === '5000') return `${origin}/api`;
  if (isLocalHost) return `${protocol}//${normalizedHost}:5000/api`;
  if (isStaticOnlyHost()) return null;
  return `${origin}/api`;
}

function backendUnavailableMessage() {
  return lang() === 'en'
    ? 'Cannot reach the backend server. Start it on http://localhost:5000 and try again.'
    : 'تعذر الاتصال بالخادم. شغّلي الـ backend على http://localhost:5000 ثم حاولي مرة أخرى.';
}

function translateApiErrorMessage(status, message) {
  const normalized = String(message || '').trim();
  if (!normalized) {
    return lang() === 'en' ? 'API Error' : 'حدث خطأ في الخادم';
  }

  if (lang() === 'en') {
    return normalized;
  }

  const translations = {
    'Database connection unavailable': 'قاعدة البيانات غير متاحة حاليًا. جرّبي مرة أخرى بعد قليل.',
    'User already exists': 'اسم المستخدم مستخدم بالفعل.',
    'Invalid credentials': 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    'Username is required': 'اسم المستخدم مطلوب.',
    'Username must be at least 3 characters': 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل.',
    'Username must be 40 characters or fewer': 'اسم المستخدم يجب ألا يزيد عن 40 حرفًا.',
    'Password is required': 'كلمة المرور مطلوبة.',
    'Password must be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    'Access denied': 'يجب تسجيل الدخول أولًا.',
    'Invalid token': 'جلسة الدخول غير صالحة. سجلي الدخول مرة أخرى.',
    'Server error': 'حدث خطأ في الخادم.',
  };

  return translations[normalized] || normalized;
}

function missingApiConfigurationMessage() {
  return lang() === 'en'
    ? 'This deployed site has no backend configured yet. Add your API URL first.'
    : 'هذا الموقع المنشور لا يملك Backend مضبوطًا بعد. أضيفي رابط الـ API أولاً.';
}

function apiConfigurationHelpText() {
  return lang() === 'en'
    ? 'Set `window.SAMA_API_URL`, add `?api_url=https://your-backend.example.com`, or save a backend URL from the login screen.'
    : 'اضبطي `window.SAMA_API_URL` أو أضيفي `?api_url=https://your-backend.example.com` أو احفظي رابط الـ backend من شاشة الدخول.';
}

function shouldPromptForApiConfiguration() {
  return !API_URL && isStaticOnlyHost();
}

function saveApiUrlConfiguration(value) {
  const normalized = normalizeApiUrl(value);
  if (!normalized) {
    throw new Error(lang() === 'en'
      ? 'Enter a full backend URL like https://your-backend.example.com/api'
      : 'أدخلي رابط Backend كامل مثل https://your-backend.example.com/api');
  }
  localStorage.setItem('sama_api_url', normalized);
  return normalized;
}

function clearApiUrlConfiguration() {
  localStorage.removeItem('sama_api_url');
}

const API_URL = resolveApiUrl();
let AUTH_TOKEN = localStorage.getItem('sama_token') || null;

async function apiRequest(path, options = {}) {
  if (!API_URL) {
    throw new Error(missingApiConfigurationMessage());
  }
  const url = `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}),
    ...options.headers
  };
  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    console.warn('API request failed before reaching the server.', error);
    throw new Error(backendUnavailableMessage());
  }

  if (response.status === 401) {
    if (AUTH_TOKEN) logout();
    return null;
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(translateApiErrorMessage(response.status, error.message));
  }
  return response.json();
}

async function loginUser(username, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: String(username || '').trim(), password: String(password || '') })
  });
  if (!data) throw new Error('Login failed');
  AUTH_TOKEN = data.token;
  localStorage.setItem('sama_token', AUTH_TOKEN);
  localStorage.setItem('sama_username', data.username);
  await load();
  if (typeof renderApp === 'function') renderApp();
}

async function registerUser(username, password) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: String(username || '').trim(), password: String(password || '') })
  });
  if (!data) throw new Error('Registration failed');
  AUTH_TOKEN = data.token;
  localStorage.setItem('sama_token', AUTH_TOKEN);
  localStorage.setItem('sama_username', data.username);
  await load();
  if (typeof renderApp === 'function') renderApp();
}

function logout() {
  AUTH_TOKEN = null;
  localStorage.removeItem('sama_token');
  localStorage.removeItem('sama_username');
  S = createDefaultState();
  saveCache();
  if (typeof renderApp === 'function') renderApp();
}

function setLoadingVisible(show){const el=document.getElementById('app-loading');if(el)el.classList.toggle('hidden',!show);}
function setSyncIndicator(state){
  const textMap=LANG_STRINGS[lang()].sync;
  [['sync-indicator','sync-text'],['sync-indicator-mobile','sync-text-mobile']].forEach(([id,textId])=>{
    const el=document.getElementById(id);const txt=document.getElementById(textId);
    if(el){el.classList.remove('syncing','synced','offline');el.classList.add(state);}
    if(txt)txt.textContent=textMap[state]||textMap.syncing;
  });
}
function saveCache(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(_err){}}
function loadCache(){
  try{
    const raw=localStorage.getItem(KEY);
    return raw?JSON.parse(raw):null;
  }catch(_err){
    return null;
  }
}
function normalizeWeekEntry(entry,index=0){
  const createdAt=entry&&typeof entry==='object'?(entry.createdAt||entry.created_at):null;
  return {
    id:Number.isFinite(Number(entry&&entry.id))?Number(entry.id):generateNumericId()+index,
    date:normalizeDateKey(entry&&((entry.date)||(entry.week_date)),todayKey()),
    w1:String(entry&&((entry.w1)||(entry.q1))||''),
    w2:String(entry&&((entry.w2)||(entry.q2))||''),
    w3:String(entry&&((entry.w3)||(entry.q3))||''),
    w4:String(entry&&((entry.w4)||(entry.q4))||''),
    createdAt:String(createdAt||new Date().toISOString()),
  };
}
function normalizeTaskEntry(task,index=0){
  return {
    id:Number.isFinite(Number(task&&task.id))?Number(task.id):generateNumericId()+index,
    title:String(task&&task.title||''),
    priority:['urgent','important','normal'].includes(task&&task.priority)?task.priority:'normal',
    repeatType:['none','daily','weekly'].includes(task&&(task.repeatType||task.repeat_type))?(task.repeatType||task.repeat_type):'none',
    goalId:Number.isFinite(Number(task&&(task.goalId??task.goal_id)))?Number(task.goalId??task.goal_id):null,
    done:Boolean(task&&task.done),
    date:normalizeDateKey(task&&(task.date||task.task_date),todayKey()),
    createdAt:String(task&&(task.createdAt||task.created_at)||new Date().toISOString()),
  };
}
function normalizeJournalEntry(entry,index=0){
  return {
    id:Number.isFinite(Number(entry&&entry.id))?Number(entry.id):generateNumericId()+index,
    date:normalizeDateKey(entry&&(entry.date||entry.journal_date),todayKey()),
    content:String(entry&&entry.content||''),
    gratitude1:String(entry&&(entry.gratitude1||entry.gratitude_1)||''),
    gratitude2:String(entry&&(entry.gratitude2||entry.gratitude_2)||''),
    gratitude3:String(entry&&(entry.gratitude3||entry.gratitude_3)||''),
    energy:clamp(Math.round(Number(entry&&(entry.energy||entry.energy_level)||5)),1,10),
    mood:clamp(Math.round(Number(entry&&entry.mood||3)),1,6),
    createdAt:String(entry&&(entry.createdAt||entry.created_at)||new Date().toISOString()),
  };
}
function normalizeStateShape(source){
  const defaults=createDefaultState();
  const src=source&&typeof source==='object'?source:{};
  const normalized={
    energy:clamp(Number.isFinite(Number(src.energy))?Math.round(Number(src.energy)):defaults.energy,1,10),
    dayType:MVD_LISTS[src.dayType]?src.dayType:defaults.dayType,
    savingsGoal:Math.max(0,Math.round(Number.isFinite(Number(src.savingsGoal))?Number(src.savingsGoal):defaults.savingsGoal)),
    habits:[],
    expenses:[],
    problems:[],
    goals:[],
    tasks:[],
    journal:[],
    budgets:{},
    xp:Math.max(0,Math.round(Number(src.xp)||0)),
    level:1,
    weeklyChallenge:src.weeklyChallenge?String(src.weeklyChallenge):null,
    weeklyChallengeDone:Boolean(src.weeklyChallengeDone),
    weeklyChallengeProgress:Math.max(0,Number(src.weeklyChallengeProgress)||0),
    energyHistory:[],
    mvdDone:{},
    weekly:{w1:'',w2:'',w3:'',w4:''},
    weeklyHistory:[],
    moodLog:[],
    settings:{fontScale:1,language:'ar',currency:defaults.settings.currency},
    pomodoro:{mode:'focus',remainingSec:1500,running:false,lastTickAt:null,sessionsToday:{},totalSessions:0},
  };

  const habitsSrc=Array.isArray(src.habits)?src.habits:defaults.habits;
  normalized.habits=habitsSrc.map((habit,index)=>({
    id:String(habit&&habit.id?habit.id:habit&&habit.name?habit.name.replace(/[^\w\u0600-\u06FF]+/g,'_'):'habit_'+(index+1)),
    name:String(habit&&habit.name?habit.name:'عادة جديدة'),
    done:uniqueDates(Array.isArray(habit&&(habit.done||habit.done_dates))?(habit.done||habit.done_dates).map(v=>normalizeDateKey(v,'')).filter(Boolean):[]),
  }));

  const expensesSrc=Array.isArray(src.expenses)?src.expenses:[];
  normalized.expenses=expensesSrc.map((expense,index)=>({
    id:Number.isFinite(Number(expense&&expense.id))?Number(expense.id):generateNumericId()+index,
    amt:Number(expense&&(expense.amt??expense.amount))||0,
    cat:String(expense&&(expense.cat||expense.category)||'أخرى'),
    note:String(expense&&expense.note||''),
    date:normalizeDateKey(expense&&(expense.date||expense.expense_date),todayKey()),
    createdAt:String(expense&&(expense.createdAt||expense.created_at)||new Date().toISOString()),
  })).filter(expense=>expense.amt>0).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))||b.id-a.id);

  const problemsSrc=Array.isArray(src.problems)?src.problems:defaults.problems;
  normalized.problems=problemsSrc.map((problem,index)=>({
    id:Number.isFinite(Number(problem&&problem.id))?Number(problem.id):generateNumericId()+index,
    title:String(problem&&problem.title||''),
    solution:String(problem&&problem.solution||''),
    duration:String(problem&&problem.duration||'٧ أيام'),
    note:String(problem&&problem.note||''),
    status:['todo','exp','done'].includes(problem&&problem.status)?problem.status:'todo',
    createdAt:String(problem&&(problem.createdAt||problem.created_at)||new Date().toISOString()),
  }));

  const goalsSrc=Array.isArray(src.goals)?src.goals:defaults.goals;
  normalized.goals=goalsSrc.map((goal,index)=>({
    id:Number.isFinite(Number(goal&&goal.id))?Number(goal.id):generateNumericId()+index,
    icon:String(goal&&goal.icon||'🎯'),
    title:String(goal&&goal.title||''),
    detail:String(goal&&goal.detail||''),
    deadline:String(goal&&goal.deadline||'٣ شهور'),
    pct:clamp(Math.round(Number(goal&&(goal.pct??goal.percentage))||0),0,100),
  }));

  const tasksSrc=Array.isArray(src.tasks)?src.tasks:[];
  normalized.tasks=tasksSrc.map((task,index)=>normalizeTaskEntry(task,index)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.createdAt).localeCompare(String(b.createdAt)));

  const journalSrc=Array.isArray(src.journal)?src.journal:[];
  normalized.journal=journalSrc.map((entry,index)=>normalizeJournalEntry(entry,index)).sort((a,b)=>String(b.date).localeCompare(String(a.date))||b.id-a.id);

  const budgetsSrc=src.budgets&&typeof src.budgets==='object'?src.budgets:{};
  Object.entries(budgetsSrc).forEach(([key,value])=>{
    const category=String((value&&value.category)||key||'أخرى');
    normalized.budgets[category]={
      id:String((value&&value.id)||budgetId(category)),
      category,
      limit:Math.max(0,Number(value&&value.limit)||0),
    };
  });

  const energyHistorySrc=Array.isArray(src.energyHistory)?src.energyHistory:[];
  normalized.energyHistory=energyHistorySrc.map(entry=>({
    date:normalizeDateKey(entry&&entry.date,todayKey()),
    value:clamp(Math.round(Number(entry&&entry.value)||normalized.energy),1,10),
  })).sort((a,b)=>String(a.date).localeCompare(String(b.date))).reduce((acc,entry)=>{
    if(!acc.find(item=>item.date===entry.date))acc.push(entry);
    return acc;
  },[]);

  const mvdDoneSrc=src.mvdDone&&typeof src.mvdDone==='object'?src.mvdDone:{};
  Object.keys(mvdDoneSrc).forEach(key=>{
    normalized.mvdDone[key]=[...new Set(Array.isArray(mvdDoneSrc[key])?mvdDoneSrc[key].map(v=>parseInt(v,10)).filter(Number.isInteger):[])];
  });

  const weeklySrc=src.weekly&&typeof src.weekly==='object'?src.weekly:{};
  normalized.weekly={w1:String(weeklySrc.w1||''),w2:String(weeklySrc.w2||''),w3:String(weeklySrc.w3||''),w4:String(weeklySrc.w4||'')};
  const weeklyHistorySrc=Array.isArray(src.weeklyHistory)?src.weeklyHistory:[];
  normalized.weeklyHistory=weeklyHistorySrc.map((entry,index)=>normalizeWeekEntry(entry,index)).sort((a,b)=>String(b.date).localeCompare(String(a.date))||b.id-a.id);
  if(!normalized.weekly.w1&&!normalized.weekly.w2&&!normalized.weekly.w3&&!normalized.weekly.w4&&normalized.weeklyHistory.length){
    const latest=normalized.weeklyHistory[0];
    normalized.weekly={w1:latest.w1,w2:latest.w2,w3:latest.w3,w4:latest.w4};
  }

  const moodSrc=Array.isArray(src.moodLog)?src.moodLog:[];
  normalized.moodLog=moodSrc.map((entry,index)=>({
    id:Number.isFinite(Number(entry&&entry.id))?Number(entry.id):generateNumericId()+index,
    date:normalizeDateKey(entry&&entry.date,todayKey()),
    mood:clamp(Math.round(Number(entry&&entry.mood)||3),1,5),
    note:String(entry&&entry.note||''),
    createdAt:String(entry&&(entry.createdAt||entry.created_at)||new Date().toISOString()),
  })).sort((a,b)=>String(b.date).localeCompare(String(a.date))||b.id-a.id).slice(0,60);

  const settingsSrc=src.settings&&typeof src.settings==='object'?src.settings:{};
  const fontScale=Number(settingsSrc.fontScale);
  const currencyValue=String(settingsSrc.currency||'').trim().toUpperCase();
  normalized.settings={
    fontScale:Number.isFinite(fontScale)?clamp(fontScale,0.9,1.2):defaults.settings.fontScale,
    language:['ar','en'].includes(settingsSrc.language)?settingsSrc.language:defaults.settings.language,
    currency:CURRENCY_OPTIONS.some(option=>option.code===currencyValue)?currencyValue:defaults.settings.currency,
  };

  const pomodoroSrc=src.pomodoro&&typeof src.pomodoro==='object'?src.pomodoro:{};
  const sessionsToday=pomodoroSrc.sessionsToday&&typeof pomodoroSrc.sessionsToday==='object'?pomodoroSrc.sessionsToday:{};
  normalized.pomodoro={
    mode:['focus','break'].includes(pomodoroSrc.mode)?pomodoroSrc.mode:'focus',
    remainingSec:Number.isFinite(Number(pomodoroSrc.remainingSec))?Math.max(0,Math.round(Number(pomodoroSrc.remainingSec))):1500,
    running:Boolean(pomodoroSrc.running),
    lastTickAt:pomodoroSrc.lastTickAt?String(pomodoroSrc.lastTickAt):null,
    sessionsToday:Object.keys(sessionsToday).reduce((acc,key)=>{acc[key]=Math.max(0,Math.round(Number(sessionsToday[key])||0));return acc;},{}),
    totalSessions:Math.max(0,Math.round(Number(pomodoroSrc.totalSessions)||0)),
  };

  normalized.level=computeLevel(normalized.xp);
  return normalized;
}

// Logic handled by the backend returning the whole state object
async function load(){
  const cache=loadCache();
  const cachedState=normalizeStateShape(cache||createDefaultState());
  S=cachedState;
  saveCache();
  
  if(!AUTH_TOKEN){
    setSyncIndicator('offline');
    return;
  }
  
  try{
    setSyncIndicator('syncing');
    const remoteState = await apiRequest('/data/state');
    if (remoteState) {
        S = normalizeStateShape(remoteState);
        saveCache();
    }
    setSyncIndicator('synced');
  }catch(err){
    console.warn('Backend load failed, using cache fallback.',err);
    S=cachedState;
    setSyncIndicator('offline');
  }
}
function save(options={}){
  S=normalizeStateShape(S);
  saveCache();
  if(!AUTH_TOKEN){
    setSyncIndicator('offline');
    return;
  }
  if(syncTimer)clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>{
    syncTimer=null;
    syncChain=syncChain.catch(()=>{}).then(async()=>{
      try{
        setSyncIndicator('syncing');
        await syncAllDataToBackend();
        saveCache();
        setSyncIndicator('synced');
      }catch(err){
        console.warn('Backend sync failed, cache kept locally.',err);
        setSyncIndicator('offline');
      }
    });
  },typeof options.delay==='number'?Math.max(0,options.delay):0);
}
