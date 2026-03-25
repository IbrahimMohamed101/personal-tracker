(function(){
  const state={
    page:null,
    stars:[],
    streaks:[],
    starRaf:0,
    threeRaf:0,
    resizeCanvas:null,
    resizeThree:null,
    pageResizeHandler:null,
    pointerMoveHandler:null,
    pointerLeaveHandler:null,
    renderer:null,
    scene:null,
    camera:null,
    coreGroup:null,
    orb:null,
    innerCore:null,
    ringA:null,
    ringB:null,
    ringC:null,
    shards:[],
    particleField:null,
    particleBase:null,
    particlePositions:null,
    pointLight:null,
    ambientLight:null,
    boost:0,
    mouseTarget:{x:0,y:0},
    mouseCurrent:{x:0,y:0},
    drawerOpen:false,
    globalBound:false,
    boostTimer:0,
    keyHandler:null,
  };

  function getHomePage(){
    const page=document.getElementById('page-home');
    return page&&page.classList.contains('cockpit-page')?page:null;
  }

  function activeHomePage(){
    const page=getHomePage();
    return page&&page.classList.contains('active')?page:null;
  }

  function setText(page,selector,value){
    const node=page.querySelector(selector);
    if(node)node.textContent=value;
  }

  function cleanupPageRuntime(){
    if(state.starRaf){
      cancelAnimationFrame(state.starRaf);
      state.starRaf=0;
    }
    if(state.threeRaf){
      cancelAnimationFrame(state.threeRaf);
      state.threeRaf=0;
    }
    if(state.page&&state.pointerMoveHandler){
      state.page.removeEventListener('mousemove',state.pointerMoveHandler);
      state.page.removeEventListener('mouseleave',state.pointerLeaveHandler);
    }
    if(state.pageResizeHandler){
      window.removeEventListener('resize',state.pageResizeHandler);
      state.pageResizeHandler=null;
    }
    if(state.keyHandler){
      window.removeEventListener('keydown',state.keyHandler);
      state.keyHandler=null;
    }

    if(state.scene&&window.THREE){
      state.scene.traverse(node=>{
        if(node.geometry&&typeof node.geometry.dispose==='function')node.geometry.dispose();
        if(node.material){
          if(Array.isArray(node.material)){
            node.material.forEach(material=>{
              if(material&&typeof material.dispose==='function')material.dispose();
            });
          }else if(typeof node.material.dispose==='function'){
            node.material.dispose();
          }
        }
      });
    }

    if(state.renderer){
      state.renderer.dispose();
      const canvas=state.renderer.domElement;
      if(canvas&&canvas.parentNode)canvas.parentNode.removeChild(canvas);
    }

    if(state.boostTimer){
      clearTimeout(state.boostTimer);
      state.boostTimer=0;
    }

    state.page=null;
    state.resizeCanvas=null;
    state.resizeThree=null;
    state.renderer=null;
    state.scene=null;
    state.camera=null;
    state.coreGroup=null;
    state.orb=null;
    state.innerCore=null;
    state.ringA=null;
    state.ringB=null;
    state.ringC=null;
    state.shards=[];
    state.particleField=null;
    state.particleBase=null;
    state.particlePositions=null;
    state.pointLight=null;
    state.ambientLight=null;
    state.stars=[];
    state.streaks=[];
    state.boost=0;
    state.mouseTarget={x:0,y:0};
    state.mouseCurrent={x:0,y:0};
    state.drawerOpen=false;
  }

  function getHomeMetrics(){
    const today=typeof todayKey==='function'?todayKey():'';
    const habits=Array.isArray(S&&S.habits)?S.habits:[];
    const tasks=Array.isArray(S&&S.tasks)?S.tasks:[];
    const dayType=S&&S.dayType?S.dayType:'normal';
    const mvdList=(typeof MVD_LISTS!=='undefined')?(MVD_LISTS[dayType]||MVD_LISTS.normal||[]):[];
    const mvdKey=`mvd_${dayType}_${today}`;
    const mvdDone=S&&S.mvdDone&&Array.isArray(S.mvdDone[mvdKey])?S.mvdDone[mvdKey].length:0;
    const habitsPct=habits.length?Math.round(habits.filter(habit=>habit.done.includes(today)).length/habits.length*100):0;
    const todayTasks=tasks.filter(task=>task.date===today);
    const tasksPct=todayTasks.length?Math.round(todayTasks.filter(task=>task.done).length/todayTasks.length*100):0;
    const mvdPct=mvdList.length?Math.round(mvdDone/mvdList.length*100):0;
    const levelData=typeof xpIntoLevel==='function'?xpIntoLevel((S&&S.xp)||0):{level:(S&&S.level)||1,progress:0,current:0,target:200};
    const focusValues=[habitsPct,mvdPct];
    if(todayTasks.length)focusValues.push(tasksPct);
    const focusPct=Math.round(focusValues.reduce((sum,value)=>sum+value,0)/Math.max(1,focusValues.length));
    return {levelData,focusPct,mvdPct,habitsPct,tasksPct};
  }

  function shipModeLabel(energy,focusPct){
    if(energy>=8&&focusPct>=75)return 'Quantum Surge';
    if(energy>=6&&focusPct>=50)return 'Cruise Vector';
    if(energy<=3)return 'Low Power';
    return 'Stable Orbit';
  }

  function updateMissionButton(page,mvdPct){
    const button=page.querySelector('#cockpit-mission-toggle');
    if(!button)return;
    button.classList.toggle('is-complete',mvdPct>=100);
  }

  function updateSceneButtonLabel(){
    const app=document.querySelector('.app');
    const button=document.getElementById('cockpit-scene-toggle');
    if(!app||!button)return;
    const hidden=app.classList.contains('sidebar-hidden');
    button.innerHTML=`<span class="cockpit-float-kicker">Scene Mode</span><strong>${hidden?'إظهار الشريط':'إخفاء الشريط'}</strong>`;
  }

  function updateHomeReadouts(page,options={}){
    if(!page||typeof S==='undefined'||!S)return;

    const {levelData,focusPct,mvdPct,habitsPct,tasksPct}=getHomeMetrics();

    setText(page,'#cockpit-level-text',`المستوى ${typeof toAr==='function'?toAr(levelData.level):levelData.level} ✦`);
    setText(page,'#cockpit-energy-value',`${typeof toAr==='function'?toAr(S.energy):S.energy}/١٠`);
    setText(page,'#cockpit-focus-value',`${typeof toAr==='function'?toAr(focusPct):focusPct}٪`);
    setText(page,'#cockpit-ship-mode',shipModeLabel(S.energy,focusPct));
    setText(page,'#cockpit-sync-mvd',`${typeof toAr==='function'?toAr(mvdPct):mvdPct}٪`);
    setText(page,'#cockpit-sync-habits',`${typeof toAr==='function'?toAr(habitsPct):habitsPct}٪`);
    setText(page,'#cockpit-sync-tasks',`${typeof toAr==='function'?toAr(tasksPct):tasksPct}٪`);

    const challengeRecord=typeof getWeekChallengeRecord==='function'?getWeekChallengeRecord():null;
    const challengeText=challengeRecord?(typeof getChallengeText==='function'?(getChallengeText(challengeRecord.id)||challengeRecord.text):challengeRecord.text):'لا يوجد تحدي أسبوعي بعد';
    setText(page,'#cockpit-home-challenge',challengeText);
    setText(page,'#cockpit-home-xp-text',S.level>=20?`${typeof toAr==='function'?toAr(S.xp):S.xp} XP`:`${typeof toAr==='function'?toAr(levelData.current):levelData.current} / ${typeof toAr==='function'?toAr(levelData.target):levelData.target}`);

    const xpBar=page.querySelector('#cockpit-home-xp-bar');
    if(xpBar){
      if(window.gsap){
        gsap.to(xpBar,{width:`${levelData.progress}%`,duration:options.boost?0.55:0.85,ease:'power3.out'});
      }else{
        xpBar.style.width=`${levelData.progress}%`;
      }
    }

    const energyBar=page.querySelector('#cockpit-energy-bar');
    if(energyBar)energyBar.style.width=`${Math.max(0,Math.min(100,S.energy*10))}%`;
    const focusBar=page.querySelector('#cockpit-focus-bar');
    if(focusBar)focusBar.style.width=`${Math.max(0,Math.min(100,focusPct))}%`;

    updateMissionButton(page,mvdPct);
  }

  /* Canvas starfield with depth and subtle streaks for atmosphere. */
  function initStarCanvas(page){
    const canvas=page.querySelector('#star-canvas');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    if(!ctx)return;

    const rebuildStars=()=>{
      const width=canvas.clientWidth||page.clientWidth||1;
      const height=canvas.clientHeight||page.clientHeight||1;
      const starCount=Math.min(210,Math.max(130,Math.round((width*height)/11000)));
      state.stars=Array.from({length:starCount},()=>({
        x:(Math.random()*2)-1,
        y:(Math.random()*2)-1,
        z:Math.random()*1.1+0.12,
        size:Math.random()*1.9+0.35,
        speed:Math.random()*0.006+0.003,
      }));
      state.streaks=Array.from({length:10},()=>({active:false}));
    };

    const resizeCanvas=()=>{
      const bounds=page.getBoundingClientRect();
      const ratio=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.max(1,Math.floor(bounds.width*ratio));
      canvas.height=Math.max(1,Math.floor(bounds.height*ratio));
      canvas.style.width=`${Math.floor(bounds.width)}px`;
      canvas.style.height=`${Math.floor(bounds.height)}px`;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      rebuildStars();
    };

    state.resizeCanvas=resizeCanvas;
    resizeCanvas();

    const activateStreak=()=>{
      const streak=state.streaks.find(item=>!item.active);
      if(!streak)return;
      streak.active=true;
      streak.x=Math.random()*(canvas.clientWidth||1);
      streak.y=Math.random()*(canvas.clientHeight*0.76||1);
      streak.length=120+Math.random()*160;
      streak.life=0;
      streak.maxLife=20+Math.random()*18;
      streak.angle=(-0.45)-(Math.random()*0.18);
      streak.speed=18+Math.random()*10;
    };

    const render=()=>{
      if(!document.body.contains(page)||!page.classList.contains('active')){
        state.starRaf=0;
        return;
      }

      const width=canvas.clientWidth||1;
      const height=canvas.clientHeight||1;
      const centerX=width/2;
      const centerY=height/2;

      ctx.clearRect(0,0,width,height);
      state.mouseCurrent.x+=(state.mouseTarget.x-state.mouseCurrent.x)*0.045;
      state.mouseCurrent.y+=(state.mouseTarget.y-state.mouseCurrent.y)*0.045;

      state.stars.forEach(star=>{
        star.z-=star.speed;
        if(star.z<=0.05){
          star.x=(Math.random()*2)-1;
          star.y=(Math.random()*2)-1;
          star.z=1.18;
        }

        const perspective=0.72/star.z;
        const px=centerX+(star.x*width*perspective*0.55)+(state.mouseCurrent.x*46*perspective);
        const py=centerY+(star.y*height*perspective*0.55)+(state.mouseCurrent.y*38*perspective);
        const radius=Math.max(0.3,star.size*perspective);
        const alpha=Math.max(0.12,1-star.z*0.65);

        ctx.beginPath();
        ctx.fillStyle=`rgba(235,247,255,${alpha})`;
        ctx.shadowBlur=10;
        ctx.shadowColor='rgba(139,234,255,0.22)';
        ctx.arc(px,py,radius,0,Math.PI*2);
        ctx.fill();
      });

      if(Math.random()<0.02)activateStreak();

      state.streaks.forEach(streak=>{
        if(!streak.active)return;
        streak.life+=1;
        const alpha=Math.max(0,1-(streak.life/streak.maxLife));
        const dx=Math.cos(streak.angle)*streak.length;
        const dy=Math.sin(streak.angle)*streak.length;
        const offset=streak.life*streak.speed;

        ctx.beginPath();
        ctx.strokeStyle=`rgba(139,234,255,${alpha*0.45})`;
        ctx.lineWidth=1.35;
        ctx.moveTo(streak.x+offset,streak.y+offset*0.08);
        ctx.lineTo(streak.x+offset-dx,streak.y+offset*0.08-dy);
        ctx.stroke();

        if(streak.life>=streak.maxLife)streak.active=false;
      });

      ctx.shadowBlur=0;
      state.starRaf=requestAnimationFrame(render);
    };

    render();
  }

  function createCoreShards(THREE){
    const shardGroup=new THREE.Group();
    const shardGeometry=new THREE.OctahedronGeometry(0.12,0);
    const shardMaterial=new THREE.MeshStandardMaterial({
      color:0xa2ebff,
      emissive:0x3652ff,
      emissiveIntensity:1.1,
      roughness:0.22,
      metalness:0.58,
    });

    state.shards=Array.from({length:18},(_,index)=>{
      const shard=new THREE.Mesh(shardGeometry,shardMaterial.clone());
      const angle=(index/18)*Math.PI*2;
      const radius=2.2+(index%5)*0.16;
      shard.userData={angle,radius,offset:index*0.32,height:(index%2===0?1:-1)*0.24};
      shard.position.set(Math.cos(angle)*radius,Math.sin(index*0.6)*0.5,Math.sin(angle)*radius*0.4);
      shard.scale.setScalar(0.82+(index%3)*0.18);
      shardGroup.add(shard);
      return shard;
    });

    return shardGroup;
  }

  function createParticleHalo(THREE){
    const count=180;
    const positions=new Float32Array(count*3);

    for(let index=0;index<count;index+=1){
      const radius=2.2+Math.random()*1.25;
      const theta=Math.random()*Math.PI*2;
      const phi=Math.acos((Math.random()*2)-1);
      positions[index*3]=radius*Math.sin(phi)*Math.cos(theta);
      positions[index*3+1]=radius*Math.sin(phi)*Math.sin(theta);
      positions[index*3+2]=radius*Math.cos(phi);
    }

    state.particleBase=positions.slice();
    state.particlePositions=positions;

    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));

    const material=new THREE.PointsMaterial({
      color:0x91dcff,
      size:0.05,
      transparent:true,
      opacity:0.95,
      blending:THREE.AdditiveBlending,
      depthWrite:false,
    });

    state.particleField=new THREE.Points(geometry,material);
    return state.particleField;
  }

  /* Three.js centerpiece: one giant core with slow motion and reactive pulses. */
  function initThreeScene(page){
    if(!window.THREE)return;

    const container=page.querySelector('#cockpit-three-container');
    if(!container)return;
    container.innerHTML='';

    const THREE=window.THREE;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(42,1,0.1,60);
    camera.position.set(0,0,7.8);

    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.15;
    container.appendChild(renderer.domElement);

    const ambientLight=new THREE.AmbientLight(0x6db4ff,0.78);
    const pointLight=new THREE.PointLight(0x88f0ff,3.1,18,2);
    pointLight.position.set(0,0,5.2);
    const rimLight=new THREE.PointLight(0x9c7dff,1.7,22,2);
    rimLight.position.set(-4,2,-1);
    scene.add(ambientLight,pointLight,rimLight);

    const coreGroup=new THREE.Group();

    const orb=new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.18,2),
      new THREE.MeshPhysicalMaterial({
        color:0x84e7ff,
        emissive:0x285dff,
        emissiveIntensity:1.2,
        roughness:0.16,
        metalness:0.22,
        transmission:0.18,
        thickness:0.8,
        transparent:true,
        opacity:0.96,
      })
    );

    const innerCore=new THREE.Mesh(
      new THREE.SphereGeometry(0.68,32,32),
      new THREE.MeshBasicMaterial({
        color:0xffda76,
        transparent:true,
        opacity:0.42,
        blending:THREE.AdditiveBlending,
      })
    );

    const ringA=new THREE.Mesh(
      new THREE.TorusGeometry(1.95,0.035,16,180),
      new THREE.MeshStandardMaterial({
        color:0x7ae9ff,
        emissive:0x2d85ff,
        emissiveIntensity:1.6,
        roughness:0.18,
        metalness:0.68,
      })
    );
    ringA.rotation.x=Math.PI/2.7;
    ringA.rotation.y=Math.PI/6;

    const ringB=new THREE.Mesh(
      new THREE.TorusGeometry(2.45,0.05,16,180),
      new THREE.MeshStandardMaterial({
        color:0xa47eff,
        emissive:0x4c37ff,
        emissiveIntensity:1.3,
        roughness:0.2,
        metalness:0.72,
      })
    );
    ringB.rotation.x=Math.PI/1.72;
    ringB.rotation.z=Math.PI/7;

    const ringC=new THREE.Mesh(
      new THREE.TorusGeometry(1.42,0.03,16,180),
      new THREE.MeshStandardMaterial({
        color:0xffd36b,
        emissive:0xc6842e,
        emissiveIntensity:1.1,
        roughness:0.24,
        metalness:0.62,
      })
    );
    ringC.rotation.x=Math.PI/3.4;
    ringC.rotation.y=Math.PI/2.2;

    coreGroup.add(orb,innerCore,ringA,ringB,ringC);
    coreGroup.add(createCoreShards(THREE));
    coreGroup.add(createParticleHalo(THREE));
    scene.add(coreGroup);

    const resizeThree=()=>{
      const width=Math.max(container.clientWidth,1);
      const height=Math.max(container.clientHeight,1);
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
      renderer.setSize(width,height,false);
    };

    state.scene=scene;
    state.camera=camera;
    state.renderer=renderer;
    state.coreGroup=coreGroup;
    state.orb=orb;
    state.innerCore=innerCore;
    state.ringA=ringA;
    state.ringB=ringB;
    state.ringC=ringC;
    state.pointLight=pointLight;
    state.ambientLight=ambientLight;
    state.resizeThree=resizeThree;
    resizeThree();

    const animate=()=>{
      if(!document.body.contains(page)||!page.classList.contains('active')){
        state.threeRaf=0;
        return;
      }

      const t=performance.now()*0.001;
      state.boost=Math.max(0,state.boost-0.018);
      state.mouseCurrent.x+=(state.mouseTarget.x-state.mouseCurrent.x)*0.05;
      state.mouseCurrent.y+=(state.mouseTarget.y-state.mouseCurrent.y)*0.05;

      coreGroup.position.y=Math.sin(t*1.4)*0.18;
      coreGroup.position.x=state.mouseCurrent.x*0.34;
      coreGroup.rotation.y+=0.008+(state.boost*0.028);
      coreGroup.rotation.x=(Math.sin(t*0.8)*0.14)+(state.mouseCurrent.y*0.22);
      coreGroup.rotation.z=(Math.sin(t*0.45)*0.08)+(state.mouseCurrent.x*0.14);

      const orbScale=1+(state.boost*0.12)+(Math.sin(t*2.2)*0.02);
      orb.scale.setScalar(orbScale);
      innerCore.scale.setScalar(1.04+(state.boost*0.22)+(Math.sin(t*2.8)*0.04));
      innerCore.material.opacity=0.34+(state.boost*0.22);
      orb.material.emissiveIntensity=1.2+(state.boost*1.9);
      pointLight.intensity=3.1+(state.boost*2.4);

      ringA.rotation.z+=0.012+(state.boost*0.02);
      ringB.rotation.x-=0.009+(state.boost*0.016);
      ringB.rotation.y+=0.007;
      ringC.rotation.y+=0.018+(state.boost*0.024);

      state.shards.forEach((shard,index)=>{
        const angle=shard.userData.angle+t*(0.3+(index*0.01));
        const radius=shard.userData.radius+(Math.sin(t+shard.userData.offset)*0.08)+(state.boost*0.18);
        shard.position.x=Math.cos(angle)*radius;
        shard.position.z=Math.sin(angle)*radius*0.58;
        shard.position.y=(Math.sin(t*1.2+shard.userData.offset)*0.42)+shard.userData.height;
        shard.rotation.x+=0.025;
        shard.rotation.y+=0.018;
      });

      if(state.particleField&&state.particlePositions&&state.particleBase){
        const positions=state.particlePositions;
        const base=state.particleBase;
        for(let index=0;index<positions.length;index+=3){
          const wave=1+(state.boost*0.24*Math.sin((index*0.08)+t*4));
          positions[index]=base[index]*wave;
          positions[index+1]=base[index+1]*(1+(state.boost*0.18*Math.cos((index*0.06)+t*3.2)));
          positions[index+2]=base[index+2]*wave;
        }
        state.particleField.geometry.attributes.position.needsUpdate=true;
        state.particleField.rotation.y-=0.0025;
        state.particleField.rotation.x+=0.001;
      }

      camera.position.x=state.mouseCurrent.x*0.72;
      camera.position.y=state.mouseCurrent.y*0.4;
      camera.lookAt(coreGroup.position);
      renderer.render(scene,camera);
      state.threeRaf=requestAnimationFrame(animate);
    };

    animate();
  }

  function initParallax(page){
    state.pointerMoveHandler=(event)=>{
      const rect=page.getBoundingClientRect();
      const relX=((event.clientX-rect.left)/Math.max(rect.width,1))-0.5;
      const relY=((event.clientY-rect.top)/Math.max(rect.height,1))-0.5;
      state.mouseTarget.x=relX;
      state.mouseTarget.y=relY;

      page.querySelectorAll('.parallax-bg').forEach(node=>{
        node.style.transform=`translate3d(${(-relX*24).toFixed(2)}px,${(-relY*18).toFixed(2)}px,0)`;
      });
      page.querySelectorAll('.parallax-mid').forEach(node=>{
        node.style.transform=`translate3d(${(-relX*16).toFixed(2)}px,${(-relY*12).toFixed(2)}px,0)`;
      });
      page.querySelectorAll('.parallax-fg').forEach(node=>{
        node.style.transform=`translate3d(${(-relX*10).toFixed(2)}px,${(-relY*8).toFixed(2)}px,0)`;
      });
    };

    state.pointerLeaveHandler=()=>{
      state.mouseTarget.x=0;
      state.mouseTarget.y=0;
      page.querySelectorAll('.cockpit-stellar-layer').forEach(node=>{
        node.style.transform='translate3d(0,0,0)';
      });
    };

    page.addEventListener('mousemove',state.pointerMoveHandler,{passive:true});
    page.addEventListener('mouseleave',state.pointerLeaveHandler,{passive:true});

    state.pageResizeHandler=()=>{
      if(typeof state.resizeCanvas==='function')state.resizeCanvas();
      if(typeof state.resizeThree==='function')state.resizeThree();
    };
    window.addEventListener('resize',state.pageResizeHandler,{passive:true});
  }

  function initCockpitEntrance(page){
    if(!window.gsap)return;

    const targets=[
      page.querySelector('.cockpit-hero-stage'),
      page.querySelector('.cockpit-float-controls'),
      page.querySelector('.cockpit-core-stage'),
      page.querySelector('.cockpit-xp-ribbon'),
      page.querySelector('.cockpit-core-caption'),
      ...Array.from(page.querySelectorAll('.cockpit-orbit-hud')),
    ].filter(Boolean);

    const greeting=page.querySelector('#home-greeting');
    const subtitle=page.querySelector('#home-sub');

    gsap.killTweensOf(targets);
    gsap.killTweensOf([greeting,subtitle]);
    gsap.set(targets,{opacity:0,y:30,scale:0.985});
    gsap.set([greeting,subtitle],{opacity:0,y:16,filter:'blur(10px)'});

    const timeline=gsap.timeline({defaults:{ease:'power3.out'}});
    timeline.to(greeting,{opacity:1,y:0,filter:'blur(0px)',duration:0.76});
    timeline.to(subtitle,{opacity:1,y:0,filter:'blur(0px)',duration:0.56},'-=0.42');
    timeline.to(targets,{
      opacity:1,
      y:0,
      scale:1,
      duration:0.78,
      stagger:0.06,
      clearProps:'opacity,transform,filter',
    },'-=0.26');
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

  function emitParticleBurst(page,x,y){
    const layer=page.querySelector('#cockpit-fx-layer');
    if(!layer)return;

    for(let index=0;index<16;index+=1){
      const particle=document.createElement('span');
      const angle=(index/16)*Math.PI*2;
      const distance=34+Math.random()*56;
      const duration=520+Math.random()*220;
      particle.className='dashboard-particle';
      particle.style.left=`${x}px`;
      particle.style.top=`${y}px`;
      layer.appendChild(particle);

      particle.animate([
        { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
        { transform:`translate(calc(-50% + ${Math.cos(angle)*distance}px), calc(-50% + ${Math.sin(angle)*distance}px)) scale(0)`, opacity:0 },
      ],{duration,easing:'cubic-bezier(0.22,1,0.36,1)',fill:'forwards'});

      setTimeout(()=>particle.remove(),duration+40);
    }

    const burst=document.createElement('span');
    burst.className='cockpit-light-burst';
    burst.style.left=`${x}px`;
    burst.style.top=`${y}px`;
    layer.appendChild(burst);
    burst.animate([
      { opacity:0.9, transform:'translate(-50%,-50%) scale(0.35)' },
      { opacity:0, transform:'translate(-50%,-50%) scale(1.15)' },
    ],{duration:520,easing:'ease-out',fill:'forwards'});
    setTimeout(()=>burst.remove(),560);
  }

  function spawnXpFloat(page,text){
    const layer=page.querySelector('#cockpit-fx-layer');
    const ribbon=page.querySelector('.cockpit-xp-ribbon');
    if(!layer||!ribbon)return;

    const pageRect=page.getBoundingClientRect();
    const ribbonRect=ribbon.getBoundingClientRect();
    const floatEl=document.createElement('span');
    floatEl.className='cockpit-xp-float';
    floatEl.textContent=text;
    floatEl.style.left=`${ribbonRect.left-pageRect.left+24}px`;
    floatEl.style.top=`${ribbonRect.top-pageRect.top-2}px`;
    layer.appendChild(floatEl);

    if(window.gsap){
      gsap.fromTo(floatEl,{opacity:0,y:12,scale:0.9},{opacity:1,y:-10,scale:1,duration:0.4,ease:'power2.out'});
      gsap.to(floatEl,{opacity:0,y:-36,duration:0.6,delay:0.34,ease:'power2.in'});
      setTimeout(()=>floatEl.remove(),1050);
      return;
    }

    floatEl.animate([
      { opacity:0, transform:'translateY(10px) scale(0.9)' },
      { opacity:1, transform:'translateY(-10px) scale(1)' },
      { opacity:0, transform:'translateY(-34px) scale(1.04)' },
    ],{duration:980,easing:'ease-out',fill:'forwards'});
    setTimeout(()=>floatEl.remove(),1040);
  }

  function pulseCore(page,intensity){
    if(!page)return;

    page.classList.add('cockpit-boost');
    if(state.boostTimer)clearTimeout(state.boostTimer);
    state.boostTimer=setTimeout(()=>page.classList.remove('cockpit-boost'),620);
    state.boost=Math.max(state.boost,0.72*intensity);

    if(window.gsap&&state.coreGroup){
      gsap.killTweensOf(state.coreGroup.scale);
      gsap.fromTo(state.coreGroup.scale,{x:1,y:1,z:1},{x:1.14+(intensity*0.04),y:1.14+(intensity*0.04),z:1.14+(intensity*0.04),duration:0.18,yoyo:true,repeat:1,ease:'power2.out'});
    }
  }

  function applyMissionDrawerState(page,open){
    if(!page)return;
    state.drawerOpen=Boolean(open);
    page.classList.toggle('mission-open',state.drawerOpen);
  }

  function openMissionDrawer(){
    const page=activeHomePage();
    if(!page)return;
    applyMissionDrawerState(page,true);
  }

  function closeMissionDrawer(){
    const page=getHomePage();
    if(!page)return;
    applyMissionDrawerState(page,false);
  }

  function toggleMissionDrawer(){
    const page=activeHomePage();
    if(!page)return;
    applyMissionDrawerState(page,!state.drawerOpen);
  }

  function handleTaskToggle(event){
    const page=activeHomePage();
    if(!page)return;

    const task=page.querySelector(`.cockpit-task[data-task-index="${event.detail.index}"]`);
    if(task){
      task.classList.remove('cockpit-task-boost');
      void task.offsetWidth;
      task.classList.add('cockpit-task-boost');
      setTimeout(()=>task.classList.remove('cockpit-task-boost'),700);
    }

    const pageRect=page.getBoundingClientRect();
    const anchor=task||page.querySelector('#cockpit-mission-toggle');
    if(anchor){
      const rect=anchor.getBoundingClientRect();
      emitParticleBurst(page,rect.left-pageRect.left+(rect.width/2),rect.top-pageRect.top+(rect.height/2));
    }

    if(event.detail.checked){
      spawnXpFloat(page,'+10 XP');
      pulseCore(page,1.15);
    }else{
      pulseCore(page,0.55);
    }

    updateHomeReadouts(page,{boost:event.detail.checked});
  }

  function syncSidebarToggleLabel(){
    const app=document.querySelector('.app');
    const button=document.getElementById('sidebar-toggle');
    if(!app||!button)return;
    const collapsed=app.classList.contains('sidebar-collapsed');
    const label=collapsed?'توسيع الشريط الجانبي':'طي الشريط الجانبي';
    button.setAttribute('aria-label',label);
    button.setAttribute('title',label);
    button.classList.toggle('is-collapsed',collapsed);
  }

  function scheduleSceneResize(){
    setTimeout(()=>{
      if(typeof state.resizeCanvas==='function')state.resizeCanvas();
      if(typeof state.resizeThree==='function')state.resizeThree();
    },320);
  }

  function setSidebarCollapsed(collapsed){
    const app=document.querySelector('.app');
    if(!app)return;
    app.classList.toggle('sidebar-collapsed',collapsed);
    localStorage.setItem('sama_sidebar_collapsed',collapsed?'1':'0');
    syncSidebarToggleLabel();
    updateSceneButtonLabel();
    scheduleSceneResize();
  }

  function toggleSidebarCollapse(){
    const app=document.querySelector('.app');
    if(!app)return;
    setSidebarCollapsed(!app.classList.contains('sidebar-collapsed'));
  }

  function setSidebarHidden(hidden){
    const app=document.querySelector('.app');
    if(!app)return;
    app.classList.toggle('sidebar-hidden',hidden);
    localStorage.setItem('sama_sidebar_hidden',hidden?'1':'0');
    updateSceneButtonLabel();
    scheduleSceneResize();
  }

  function toggleSidebarVisibility(){
    const app=document.querySelector('.app');
    if(!app)return;
    setSidebarHidden(!app.classList.contains('sidebar-hidden'));
  }

  function bindGlobalListeners(){
    if(state.globalBound)return;
    state.globalBound=true;
    window.addEventListener('dashboard:mvd-toggle',handleTaskToggle);
  }

  function dashboardCockpitRefresh(options={}){
    const page=getHomePage();
    if(!page)return;
    updateHomeReadouts(page,options);
    updateSceneButtonLabel();
  }

  function dashboardCockpitInit(options={}){
    bindGlobalListeners();
    syncSidebarToggleLabel();
    updateSceneButtonLabel();

    const page=activeHomePage();
    if(!page)return;

    cleanupPageRuntime();
    state.page=page;
    applyMissionDrawerState(page,false);
    initStarCanvas(page);
    initParallax(page);
    initThreeScene(page);
    initTaskInteractions(page);
    updateHomeReadouts(page);

    state.keyHandler=(event)=>{
      if(event.key==='Escape')closeMissionDrawer();
    };
    window.addEventListener('keydown',state.keyHandler);

    if(!options.skipEntrance)initCockpitEntrance(page);
  }

  window.toggleSidebarCollapse=toggleSidebarCollapse;
  window.toggleSidebarVisibility=toggleSidebarVisibility;
  window.openMissionDrawer=openMissionDrawer;
  window.closeMissionDrawer=closeMissionDrawer;
  window.toggleMissionDrawer=toggleMissionDrawer;
  window.dashboardCockpitInit=dashboardCockpitInit;
  window.dashboardCockpitRefresh=dashboardCockpitRefresh;
})();
