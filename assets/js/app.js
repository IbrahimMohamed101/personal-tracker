// INIT
function applyGreeting(){
  const hr=new Date().getHours();
  const greetEl=document.getElementById('home-greeting');
  if(greetEl){
    if(lang()==='en'){
      greetEl.textContent=hr<5?'Late Night, Sama ✦':hr<12?'Good Morning, Sama ✦':hr<17?'Good Afternoon, Sama ✦':'Good Evening, Sama ✦';
    } else {
      greetEl.textContent=(hr<5?'أهلاً بكِ':hr<12?'صباح الخير':hr<17?'مساء النور':'مساء الخير')+' يا سما ✦';
    }
  }
  const subEl=document.getElementById('home-sub');
  if(subEl){
    if(lang()==='en'){
      subEl.textContent=hr<5?'Late hours, rest well...':hr<12?'A new day, a new chance!':hr<17?'Keep up the great work!':'Evening is for reflection.';
    } else {
      subEl.textContent=hr<5?'وقت متأخر — ارتاحي كويس 💙':hr<12?'يوم جديد، فرصة جديدة 🌤️':hr<17?'استمري في يومك بثبات 💪':hr<22?'الليل وقت التحصيل والمراجعة 🌙':'نهاية اليوم، استعدي للراحة ✨';
    }
  }
}
function renderActivePage(){
  const active=document.querySelector('.page.active');
  const pageId=active&&active.id?active.id.replace('page-',''):'home';
  document.getElementById('energy-rng').value=S.energy;
  setEnergy(S.energy,false);
  applySettings();
  syncPageNav(pageId);
  renderXpUi();
  if(pageId==='tasks')renderTasks();
  else if(pageId==='habits')renderHabits();
  else if(pageId==='money')renderMoney();
  else if(pageId==='problems')renderProblems();
  else if(pageId==='journal')renderJournal();
  else if(pageId==='mood')renderMood();
  else if(pageId==='analytics')renderAnalytics();
  else if(pageId==='goals')renderGoals();
  else if(pageId==='pomodoro')renderPomodoro();
  else if(pageId==='weekly')loadWeekly();
  else if(pageId==='achievements')renderAchievements();
  else if(pageId==='tips')renderTips('all');
  else if(pageId==='guide')renderGuide();
  else if(pageId==='settings')renderSettings();
  else renderHome();
}

function renderGuide(){
  // The guide page is purely HTML static content from templates.js
  // We just ensure the page renders correctly by being focused.
}

function ensureEnergyHistoryToday(){
  if(!Array.isArray(S.energyHistory))S.energyHistory=[];
  const today=todayKey();
  if(!S.energyHistory.some(entry=>entry.date===today)){
    S.energyHistory.unshift({date:today,value:S.energy});
  }
}
const initMobileSwipeHint = () => {
  if (window.innerWidth < 768 && !localStorage.getItem('samaSwipeHintShown')) {
    const nav = document.querySelector('.mobile-nav-track');
    if(nav) {
      nav.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-15px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ], { duration: 600, delay: 1000, easing: 'ease-in-out' });
      localStorage.setItem('samaSwipeHintShown', 'true');
    }
  }
};

function renderApp() {
  const root = document.getElementById('app-root');
  if (!AUTH_TOKEN) {
    if (typeof renderLoginScreen === 'function') {
        renderLoginScreen(root);
    } else {
        root.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;gap:20px;">' +
            '<h2>Sama OS</h2>' +
            '<button onclick="showLogin()" style="padding:10px 20px;border-radius:12px;background:var(--accent);color:white;border:none;">تسجيل الدخول</button>' +
            '</div>';
    }
    return;
  }
  
  renderAppShell();
  updateClock();
  applyGreeting();
  ensureEnergyHistoryToday();
  ensureWeeklyChallenge();
  refreshRecurringTasks();
  updateWeeklyChallengeProgress();
  ensurePomodoroFresh();
  if(S.pomodoro.running)startPomodoroInterval();
  renderActivePage();
  setLoadingVisible(false);
  initMobileSwipeHint();
}

async function initApp(){
  if (AUTH_TOKEN) {
    try {
      setLoadingVisible(true);
      await load();
    } catch(err) {
      console.error('Initial load failed', err);
    }
  }
  renderApp();
}
initApp();

window.confirmAddHabit=confirmAddHabit;
window.confirmAddProblem=confirmAddProblem;
window.confirmAddGoal=confirmAddGoal;
window.closeModal=closeModal;
