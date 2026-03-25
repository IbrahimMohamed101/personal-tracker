(function(){
  const cockpitState={
    page:null,
    stars:[],
    starRaf:0,
    resizeHandler:null,
    parallaxMoveHandler:null,
    parallaxLeaveHandler:null,
    statsObserver:null,
    shipTween:null,
    globalBound:false,
  };

  const ARABIC_TO_LATIN={ '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };

  function getHomePage(){
    const page=document.getElementById('page-home');
    return page&&page.classList.contains('cockpit-page')?page:null;
  }

  function translateDigits(value){
    return String(value||'').replace(/[٠-٩]/g,char=>ARABIC_TO_LATIN[char]||char);
  }

  function parseDisplayedNumber(value){
    const normalized=translateDigits(value).replace(/[^\d.-]/g,'');
    return Number(normalized||0);
  }

  function cleanupDetachedState(){
    if(cockpitState.page&&document.body.contains(cockpitState.page))return;
    if(cockpitState.starRaf){
      cancelAnimationFrame(cockpitState.starRaf);
      cockpitState.starRaf=0;
    }
    if(cockpitState.resizeHandler){
      window.removeEventListener('resize',cockpitState.resizeHandler);
      cockpitState.resizeHandler=null;
    }
    if(cockpitState.page&&cockpitState.parallaxMoveHandler){
      cockpitState.page.removeEventListener('mousemove',cockpitState.parallaxMoveHandler);
      cockpitState.page.removeEventListener('mouseleave',cockpitState.parallaxLeaveHandler);
    }
    if(cockpitState.statsObserver){
      cockpitState.statsObserver.disconnect();
      cockpitState.statsObserver=null;
    }
    if(cockpitState.shipTween&&typeof cockpitState.shipTween.kill==='function'){
      cockpitState.shipTween.kill();
    }
    cockpitState.shipTween=null;
    cockpitState.page=null;
  }

  function initStarCanvas(page){
    if(cockpitState.page!==page){
      cleanupDetachedState();
      cockpitState.page=page;
    }

    const canvas=page.querySelector('#star-canvas');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    if(!ctx)return;

    if(cockpitState.resizeHandler){
      window.removeEventListener('resize',cockpitState.resizeHandler);
    }
    if(cockpitState.starRaf){
      cancelAnimationFrame(cockpitState.starRaf);
    }

    const buildStars=()=>{
      const width=canvas.width;
      const height=canvas.height;
      const starCount=Math.min(190,Math.max(110,Math.round((width*height)/11500)));
      cockpitState.stars=Array.from({length:starCount},()=>({
        x:Math.random()*width,
        y:Math.random()*height,
        radius:Math.random()*1.9+0.35,
        alpha:Math.random()*0.7+0.18,
        velocityX:(Math.random()-0.5)*0.12,
        velocityY:Math.random()*0.28+0.08,
      }));
    };

    const resizeCanvas=()=>{
      const bounds=page.getBoundingClientRect();
      const ratio=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.max(1,Math.floor(bounds.width*ratio));
      canvas.height=Math.max(1,Math.floor(bounds.height*ratio));
      canvas.style.width=`${Math.floor(bounds.width)}px`;
      canvas.style.height=`${Math.floor(bounds.height)}px`;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      buildStars();
    };

    const render=()=>{
      if(!document.body.contains(canvas))return;
      const width=canvas.clientWidth;
      const height=canvas.clientHeight;
      ctx.clearRect(0,0,width,height);

      cockpitState.stars.forEach(star=>{
        star.x+=star.velocityX;
        star.y+=star.velocityY;
        if(star.y>height+6){
          star.y=-6;
          star.x=Math.random()*width;
        }
        if(star.x>width+6)star.x=-6;
        if(star.x<-6)star.x=width+6;

        ctx.beginPath();
        ctx.fillStyle=`rgba(255,255,255,${star.alpha})`;
        ctx.shadowBlur=12;
        ctx.shadowColor='rgba(126,231,255,0.28)';
        ctx.arc(star.x,star.y,star.radius,0,Math.PI*2);
        ctx.fill();
      });

      ctx.shadowBlur=0;
      cockpitState.starRaf=requestAnimationFrame(render);
    };

    cockpitState.resizeHandler=resizeCanvas;
    window.addEventListener('resize',resizeCanvas,{passive:true});
    resizeCanvas();
    render();
  }

  function initParallax(page){
    if(cockpitState.parallaxMoveHandler){
      page.removeEventListener('mousemove',cockpitState.parallaxMoveHandler);
      page.removeEventListener('mouseleave',cockpitState.parallaxLeaveHandler);
    }

    const layers=[
      {selector:'.parallax-bg',x:16,y:12},
      {selector:'.parallax-mid',x:10,y:8},
      {selector:'.parallax-fg',x:6,y:4},
    ];

    cockpitState.parallaxMoveHandler=(event)=>{
      const rect=page.getBoundingClientRect();
      const relX=((event.clientX-rect.left)/Math.max(rect.width,1))-0.5;
      const relY=((event.clientY-rect.top)/Math.max(rect.height,1))-0.5;
      layers.forEach(layer=>{
        page.querySelectorAll(layer.selector).forEach(node=>{
          node.style.transform=`translate3d(${(-relX*layer.x).toFixed(2)}px,${(-relY*layer.y).toFixed(2)}px,0)`;
        });
      });
    };

    cockpitState.parallaxLeaveHandler=()=>{
      layers.forEach(layer=>{
        page.querySelectorAll(layer.selector).forEach(node=>{
          node.style.transform='translate3d(0,0,0)';
        });
      });
    };

    page.addEventListener('mousemove',cockpitState.parallaxMoveHandler,{passive:true});
    page.addEventListener('mouseleave',cockpitState.parallaxLeaveHandler,{passive:true});
  }

  function animateGreeting(page){
    const greeting=page.querySelector('#home-greeting');
    const sub=page.querySelector('#home-sub');
    if(!greeting)return;

    if(window.gsap){
      gsap.killTweensOf([greeting,sub]);
      gsap.set(greeting,{opacity:0,y:18});
      if(sub)gsap.set(sub,{opacity:0,y:10});
      gsap.to(greeting,{opacity:1,y:0,duration:0.7,ease:'power3.out'});
      if(sub)gsap.to(sub,{opacity:1,y:0,duration:0.6,delay:0.14,ease:'power2.out'});
      return;
    }

    greeting.style.opacity='1';
    if(sub)sub.style.opacity='1';
  }

  function initCockpitEntrance(page){
    animateGreeting(page);
    const items=[
      '.cockpit-xp-card',
      '.cockpit-streak-card',
      '.cockpit-mvd-panel',
      '.cockpit-control-panel',
      '.cockpit-stat-card',
      '.cockpit-life-card',
    ];
    const nodes=items.flatMap(selector=>Array.from(page.querySelectorAll(selector)));
    if(!nodes.length)return;

    if(window.gsap){
      gsap.killTweensOf(nodes);
      gsap.set(nodes,{opacity:0,y:26,scale:0.98});
      gsap.to(nodes,{
        opacity:1,
        y:0,
        scale:1,
        duration:0.72,
        stagger:0.06,
        ease:'power3.out',
        clearProps:'opacity,transform',
      });
      return;
    }

    nodes.forEach(node=>{
      node.style.opacity='1';
      node.style.transform='translateY(0)';
    });
  }

  function getHomeMetrics(){
    const today=typeof todayKey==='function'?todayKey():'';
    const hasState=typeof S!=='undefined'&&S;
    const habits=(hasState&&Array.isArray(S.habits))?S.habits:[];
    const tasks=(hasState&&Array.isArray(S.tasks))?S.tasks:[];
    const mvdList=(typeof MVD_LISTS!=='undefined'&&hasState)?(MVD_LISTS[S.dayType]||MVD_LISTS.normal||[]):[];
    const mvdKey=hasState?`mvd_${S.dayType}_${today}`:'';
    const mvdDone=hasState&&S.mvdDone&&Array.isArray(S.mvdDone[mvdKey])?S.mvdDone[mvdKey].length:0;
    const habitsPct=habits.length?Math.round(habits.filter(habit=>habit.done.includes(today)).length/habits.length*100):0;
    const todayTasks=tasks.filter(task=>task.date===today);
    const tasksPct=todayTasks.length?Math.round(todayTasks.filter(task=>task.done).length/todayTasks.length*100):0;
    const mvdPct=mvdList.length?Math.round(mvdDone/mvdList.length*100):0;
    const levelData=typeof xpIntoLevel==='function'?xpIntoLevel((hasState&&S.xp)||0):{level:(hasState&&S.level)||1,progress:0,current:0,target:200};
    const maxStreak=habits.reduce((max,habit)=>Math.max(max,typeof calcMaxStreak==='function'?calcMaxStreak(habit.done):0),0);
    const focusValues=[habitsPct,mvdPct];
    if(todayTasks.length)focusValues.push(tasksPct);
    const focusPct=Math.round(focusValues.reduce((sum,value)=>sum+value,0)/Math.max(1,focusValues.length));
    return {levelData,maxStreak,focusPct};
  }

  function shipModeLabel(energy,focusPct){
    if(energy>=8&&focusPct>=70)return 'Hyper Drive';
    if(energy>=6&&focusPct>=45)return 'Cruise Mode';
    if(energy<=3)return 'Low Orbit';
    return 'Stabilizing';
  }

  function updateHomeReadouts(page,options={}){
    if(typeof S==='undefined'||!S)return;
    const {levelData,maxStreak,focusPct}=getHomeMetrics();
    const setText=(selector,value)=>{
      const node=page.querySelector(selector);
      if(node)node.textContent=value;
    };

    setText('#cockpit-level-text',`المستوى ${typeof toAr==='function'?toAr(levelData.level):levelData.level} ✦`);
    setText('#cockpit-home-xp-text',S.level>=20?`${typeof toAr==='function'?toAr(S.xp):S.xp} XP`:`${typeof toAr==='function'?toAr(levelData.current):levelData.current} / ${typeof toAr==='function'?toAr(levelData.target):levelData.target}`);
    setText('#cockpit-level-badge',typeof toAr==='function'?toAr(S.level||1):String(S.level||1));
    setText('#cockpit-streak-value',typeof toAr==='function'?toAr(maxStreak):String(maxStreak));
    setText('#cockpit-energy-value',`${typeof toAr==='function'?toAr(S.energy):S.energy}/١٠`);
    setText('#cockpit-focus-value',`${typeof toAr==='function'?toAr(focusPct):focusPct}٪`);
    setText('#cockpit-ship-mode',shipModeLabel(S.energy,focusPct));

    const challengeRecord=typeof getWeekChallengeRecord==='function'?getWeekChallengeRecord():null;
    const challengeText=challengeRecord?(typeof getChallengeText==='function'?(getChallengeText(challengeRecord.id)||challengeRecord.text):challengeRecord.text):'لا يوجد تحدي أسبوعي بعد';
    setText('#cockpit-home-challenge',challengeText);

    const xpBar=page.querySelector('#cockpit-home-xp-bar');
    if(xpBar){
      if(window.gsap){
        gsap.to(xpBar,{width:`${levelData.progress}%`,duration:options.boost?0.65:0.9,ease:'power3.out'});
      }else{
        xpBar.style.width=`${levelData.progress}%`;
      }
    }

    const energyBar=page.querySelector('#cockpit-energy-bar');
    if(energyBar)energyBar.style.width=`${Math.max(0,Math.min(100,S.energy*10))}%`;
    const focusBar=page.querySelector('#cockpit-focus-bar');
    if(focusBar)focusBar.style.width=`${Math.max(0,Math.min(100,focusPct))}%`;
  }

  function formatCounterValue(element,value){
    const format=element.dataset.counterFormat||'int';
    if(format==='money')return typeof toArFull==='function'?toArFull(value):String(value);
    if(format==='percent')return `${typeof toAr==='function'?toAr(value):value}٪`;
    return typeof toAr==='function'?toAr(value):String(value);
  }

  function animateCounter(element){
    const finalText=element.dataset.finalText||element.textContent.trim();
    const target=parseDisplayedNumber(finalText);
    const duration=850;
    const start=performance.now();

    element.dataset.finalText=finalText;

    const step=(now)=>{
      const progress=Math.min((now-start)/duration,1);
      const eased=1-Math.pow(1-progress,3);
      const current=Math.round(target*eased);
      element.textContent=formatCounterValue(element,current);
      if(progress<1){
        requestAnimationFrame(step);
      }else{
        element.textContent=finalText;
      }
    };

    requestAnimationFrame(step);
  }

  function initStatCounters(page){
    const values=page.querySelectorAll('.cockpit-stat-value');
    values.forEach(value=>{
      value.dataset.finalText=value.textContent.trim();
      value.textContent=formatCounterValue(value,0);
    });

    if(cockpitState.statsObserver){
      cockpitState.statsObserver.disconnect();
    }

    if(!('IntersectionObserver'in window)){
      values.forEach(animateCounter);
      return;
    }

    cockpitState.statsObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          animateCounter(entry.target);
          cockpitState.statsObserver.unobserve(entry.target);
        }
      });
    },{threshold:0.35});

    values.forEach(value=>cockpitState.statsObserver.observe(value));
  }

  function initTaskInteractions(page){
    page.querySelectorAll('.cockpit-task').forEach(task=>{
      if(task.dataset.cockpitBound==='true')return;
      task.dataset.cockpitBound='true';
      task.addEventListener('pointerdown',()=>{
        if(window.gsap){
          gsap.fromTo(task,{scale:1},{scale:0.985,duration:0.12,yoyo:true,repeat:1,ease:'power1.out'});
        }
      },{passive:true});
    });
  }

  function initSpaceship(page){
    const ship=page.querySelector('.cockpit-spaceship');
    if(!ship)return;
    if(cockpitState.shipTween&&typeof cockpitState.shipTween.kill==='function'){
      cockpitState.shipTween.kill();
    }
    if(window.gsap){
      cockpitState.shipTween=gsap.to(ship,{
        y:-12,
        x:8,
        rotation:1.8,
        duration:2.4,
        ease:'sine.inOut',
        repeat:-1,
        yoyo:true,
      });
    }
  }

  function thrustSpaceship(page){
    const ship=page.querySelector('.cockpit-spaceship');
    if(!ship||!window.gsap)return;
    gsap.fromTo(ship,{filter:'drop-shadow(0 0 18px rgba(126,231,255,0.28))'},{filter:'drop-shadow(0 0 34px rgba(255,211,110,0.48))',duration:0.18,yoyo:true,repeat:1,ease:'power2.out'});
    gsap.fromTo(ship,{x:0,scale:1},{x:-8,scale:1.03,duration:0.18,yoyo:true,repeat:1,ease:'power2.out'});
  }

  function handleTaskToggle(event){
    const page=getHomePage();
    if(!page||!page.classList.contains('active'))return;
    const task=page.querySelector(`.cockpit-task[data-task-index="${event.detail.index}"]`);
    if(task){
      task.classList.remove('cockpit-task-boost');
      void task.offsetWidth;
      task.classList.add('cockpit-task-boost');
      setTimeout(()=>task.classList.remove('cockpit-task-boost'),760);
      if(window.gsap){
        gsap.fromTo(task,{scale:0.97},{scale:1,duration:0.46,ease:'elastic.out(1,0.5)'});
      }
    }
    updateHomeReadouts(page,{boost:true});
    initStatCounters(page);
    thrustSpaceship(page);
  }

  function bindGlobalListeners(){
    if(cockpitState.globalBound)return;
    cockpitState.globalBound=true;
    window.addEventListener('dashboard:mvd-toggle',handleTaskToggle);
  }

  function dashboardCockpitInit(options={}){
    bindGlobalListeners();
    const page=getHomePage();
    if(!page)return;
    initStarCanvas(page);
    initParallax(page);
    initSpaceship(page);
    initTaskInteractions(page);
    updateHomeReadouts(page);
    initStatCounters(page);
    if(!options.skipEntrance)initCockpitEntrance(page);
  }

  window.dashboardCockpitInit=dashboardCockpitInit;
})();
