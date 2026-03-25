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
    keyHandler:null,
    renderer:null,
    scene:null,
    camera:null,
    coreGroup:null,
    orb:null,
    innerCore:null,
    shellMesh:null,
    rings:[],
    shards:[],
    particleField:null,
    particleBase:null,
    particlePositions:null,
    ambientLight:null,
    pointLight:null,
    rimLight:null,
    mouseTarget:{x:0,y:0},
    mouseCurrent:{x:0,y:0},
    boost:0,
    surge:0,
    hueShift:0,
    drawerOpen:false,
    globalBound:false,
    pointerTrailStamp:0,
    boostTimer:0,
    intervals:[],
    timeouts:[],
    spawnMeteor:null,
    scrambleInterval:0,
  };

  const WHISPER_LABELS={
    energy:['ENERGY','PLASMA','VITAL','CORE'],
    focus:['FOCUS','VECTOR','LOCK','AIM'],
    mode:['MODE','STATE','DRIFT','FIELD'],
  };

  const PROMPTS=[
    'Tap the core and let the scene fracture',
    'Cursor drift changes the field geometry',
    'The void reacts faster than the data',
    'Everything here is signal, nothing is stable',
    'Push the center and watch the room bend',
  ];

  const VOID_WORDS=['Glitch','Warp','Null','Prism','Noise','Shiver'];

  function rememberTimeout(id){
    if(id)state.timeouts.push(id);
    return id;
  }

  function rememberInterval(id){
    if(id)state.intervals.push(id);
    return id;
  }

  function clearStoredTimers(){
    state.timeouts.forEach(id=>clearTimeout(id));
    state.intervals.forEach(id=>clearInterval(id));
    state.timeouts=[];
    state.intervals=[];
    if(state.scrambleInterval){
      clearInterval(state.scrambleInterval);
      state.scrambleInterval=0;
    }
  }

  function randomChoice(items){
    return items[Math.floor(Math.random()*items.length)];
  }

  function randomBetween(min,max){
    return min+(Math.random()*(max-min));
  }

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

  function syncGlitchTitle(page){
    const title=page.querySelector('#home-greeting');
    if(title)title.setAttribute('data-text',title.textContent||'');
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
    clearStoredTimers();

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
    state.shellMesh=null;
    state.rings=[];
    state.shards=[];
    state.particleField=null;
    state.particleBase=null;
    state.particlePositions=null;
    state.ambientLight=null;
    state.pointLight=null;
    state.rimLight=null;
    state.stars=[];
    state.streaks=[];
    state.mouseTarget={x:0,y:0};
    state.mouseCurrent={x:0,y:0};
    state.boost=0;
    state.surge=0;
    state.hueShift=0;
    state.drawerOpen=false;
    state.pointerTrailStamp=0;
    state.spawnMeteor=null;
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
    return {levelData,focusPct,mvdPct,habitsPct,tasksPct,mvdDone,totalMvd:mvdList.length};
  }

  function shipModeLabel(energy,focusPct){
    if(energy>=9&&focusPct>=75)return 'Nova Bloom';
    if(energy>=7&&focusPct>=58)return 'Prism Cruise';
    if(energy<=3)return 'Quiet Void';
    return 'Stable Orbit';
  }

  function updateMissionButton(page,mvdPct){
    const button=page.querySelector('#cockpit-mission-toggle');
    if(button)button.classList.toggle('is-complete',mvdPct>=100);
  }

  function updateSceneButtonLabel(){
    const app=document.querySelector('.app');
    const node=document.querySelector('#cockpit-scene-toggle strong');
    if(!app||!node)return;
    node.textContent=app.classList.contains('sidebar-hidden')?'Show Rail':'Hide Rail';
  }

  function updateAmbientLabels(page){
    const prompt=page.querySelector('#cockpit-core-prompt');
    if(prompt&&!state.scrambleInterval)prompt.textContent=randomChoice(PROMPTS);
  }

  function updateHomeReadouts(page,options={}){
    if(!page||typeof S==='undefined'||!S)return;

    const {levelData,focusPct,mvdPct,habitsPct,tasksPct,mvdDone,totalMvd}=getHomeMetrics();
    const arValue=typeof toAr==='function'?toAr:null;
    const currentValue=arValue?arValue(levelData.current):levelData.current;
    const targetValue=arValue?arValue(levelData.target):levelData.target;
    const mvdText=`${arValue?arValue(mvdDone):mvdDone} / ${arValue?arValue(totalMvd):totalMvd}`;

    setText(page,'#mvd-done-count',mvdText);
    setText(page,'#mvd-done-pct',`${arValue?arValue(mvdPct):mvdPct}٪`);
    setText(page,'#cockpit-level-text',`المستوى ${arValue?arValue(levelData.level):levelData.level} ✦`);
    setText(page,'#cockpit-sync-mvd',`${arValue?arValue(mvdPct):mvdPct}٪`);
    setText(page,'#cockpit-sync-habits',`${arValue?arValue(habitsPct):habitsPct}٪`);
    setText(page,'#cockpit-sync-tasks',`${arValue?arValue(tasksPct):tasksPct}٪`);
    setText(page,'#cockpit-energy-value',`${arValue?arValue(S.energy):S.energy}/١٠`);
    setText(page,'#cockpit-focus-value',`${arValue?arValue(focusPct):focusPct}٪`);
    setText(page,'#cockpit-ship-mode',shipModeLabel(S.energy,focusPct));
    setText(page,'#cockpit-home-xp-text',`${currentValue} / ${targetValue}`);

    const challengeRecord=typeof getWeekChallengeRecord==='function'?getWeekChallengeRecord():null;
    const challengeText=challengeRecord?(typeof getChallengeText==='function'?(getChallengeText(challengeRecord.id)||challengeRecord.text):challengeRecord.text):'لا يوجد تحدي أسبوعي بعد';
    setText(page,'#cockpit-home-challenge',challengeText);

    const bar=page.querySelector('#mvd-bar');
    if(bar)bar.style.width=`${Math.max(0,Math.min(100,mvdPct))}%`;

    updateMissionButton(page,mvdPct);
    updateSceneButtonLabel();
    syncGlitchTitle(page);

    if(options.boost){
      const prompt=page.querySelector('#cockpit-core-prompt');
      if(prompt)prompt.textContent='Signal spike detected';
    }
  }

  function initStarCanvas(page){
    const canvas=page.querySelector('#star-canvas');
    if(!canvas)return;
    const ctx=canvas.getContext('2d');
    if(!ctx)return;

    const rebuildStars=()=>{
      const width=canvas.clientWidth||page.clientWidth||1;
      const height=canvas.clientHeight||page.clientHeight||1;
      const count=Math.min(240,Math.max(150,Math.round((width*height)/9500)));
      state.stars=Array.from({length:count},()=>({
        x:(Math.random()*2)-1,
        y:(Math.random()*2)-1,
        z:Math.random()*1.18+0.08,
        size:Math.random()*1.8+0.35,
        speed:Math.random()*0.007+0.0025,
        hue:180+Math.random()*110,
        twinkle:0.8+Math.random()*2.4,
        phase:Math.random()*Math.PI*2,
      }));
      state.streaks=[];
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

    const pushMeteor=(strong=false)=>{
      const width=canvas.clientWidth||1;
      const height=canvas.clientHeight||1;
      state.streaks.push({
        active:true,
        x:Math.random()*width*0.9,
        y:Math.random()*height*0.68,
        length:(strong?180:110)+Math.random()*(strong?180:110),
        life:0,
        maxLife:(strong?30:18)+Math.random()*(strong?14:10),
        angle:-0.48-(Math.random()*0.16),
        speed:(strong?28:16)+Math.random()*(strong?16:10),
        hue:180+Math.random()*120,
      });
    };

    state.resizeCanvas=resizeCanvas;
    state.spawnMeteor=(count=1,strong=false)=>{
      for(let index=0;index<count;index+=1)pushMeteor(strong);
    };
    resizeCanvas();

    const render=()=>{
      if(!document.body.contains(page)||!page.classList.contains('active')){
        state.starRaf=0;
        return;
      }

      const width=canvas.clientWidth||1;
      const height=canvas.clientHeight||1;
      const centerX=width/2;
      const centerY=height/2;
      const time=performance.now()*0.001;

      ctx.clearRect(0,0,width,height);

      const nebulaA=ctx.createRadialGradient(
        width*(0.28+state.mouseCurrent.x*0.04),
        height*(0.22+state.mouseCurrent.y*0.04),
        0,
        width*(0.28+state.mouseCurrent.x*0.04),
        height*(0.22+state.mouseCurrent.y*0.04),
        width*0.34
      );
      nebulaA.addColorStop(0,'rgba(93,206,255,0.12)');
      nebulaA.addColorStop(0.5,'rgba(93,206,255,0.03)');
      nebulaA.addColorStop(1,'rgba(93,206,255,0)');
      ctx.fillStyle=nebulaA;
      ctx.fillRect(0,0,width,height);

      const nebulaB=ctx.createRadialGradient(
        width*(0.72-state.mouseCurrent.x*0.05),
        height*(0.3-state.mouseCurrent.y*0.04),
        0,
        width*(0.72-state.mouseCurrent.x*0.05),
        height*(0.3-state.mouseCurrent.y*0.04),
        width*0.28
      );
      nebulaB.addColorStop(0,'rgba(170,125,255,0.14)');
      nebulaB.addColorStop(0.52,'rgba(170,125,255,0.03)');
      nebulaB.addColorStop(1,'rgba(170,125,255,0)');
      ctx.fillStyle=nebulaB;
      ctx.fillRect(0,0,width,height);

      state.mouseCurrent.x+=(state.mouseTarget.x-state.mouseCurrent.x)*0.042;
      state.mouseCurrent.y+=(state.mouseTarget.y-state.mouseCurrent.y)*0.042;

      state.stars.forEach(star=>{
        star.z-=star.speed*(1+(state.boost*0.8));
        if(star.z<=0.04){
          star.x=(Math.random()*2)-1;
          star.y=(Math.random()*2)-1;
          star.z=1.16;
          star.hue=180+Math.random()*120;
        }

        const perspective=0.74/star.z;
        const px=centerX+(star.x*width*perspective*0.55)+(state.mouseCurrent.x*48*perspective);
        const py=centerY+(star.y*height*perspective*0.58)+(state.mouseCurrent.y*38*perspective);
        const radius=Math.max(0.35,star.size*perspective);
        const twinkle=0.45+((Math.sin(time*star.twinkle+star.phase)+1)*0.28);
        const alpha=Math.max(0.12,1-(star.z*0.62))*twinkle;
        const hue=(star.hue+(Math.sin(time*0.8+star.phase)*24)+(state.surge*42))%360;

        ctx.beginPath();
        ctx.fillStyle=`hsla(${hue}, 100%, 82%, ${alpha})`;
        ctx.shadowBlur=10+(state.boost*16);
        ctx.shadowColor=`hsla(${hue}, 100%, 70%, 0.28)`;
        ctx.arc(px,py,radius,0,Math.PI*2);
        ctx.fill();
      });

      if(Math.random()<0.014)pushMeteor(false);
      if(state.boost>0.26&&Math.random()<0.18)pushMeteor(true);

      state.streaks=state.streaks.filter(streak=>{
        streak.life+=1;
        const alpha=Math.max(0,1-(streak.life/streak.maxLife));
        const dx=Math.cos(streak.angle)*streak.length;
        const dy=Math.sin(streak.angle)*streak.length;
        const offset=streak.life*streak.speed;

        ctx.beginPath();
        ctx.strokeStyle=`hsla(${streak.hue}, 100%, 72%, ${alpha*0.6})`;
        ctx.lineWidth=1.4+(state.boost*1.1);
        ctx.moveTo(streak.x+offset,streak.y+(offset*0.08));
        ctx.lineTo(streak.x+offset-dx,streak.y+(offset*0.08)-dy);
        ctx.stroke();
        return streak.life<streak.maxLife;
      });

      if(state.surge>0.18){
        ctx.save();
        ctx.translate(centerX,centerY);
        for(let index=0;index<12;index+=1){
          ctx.rotate((Math.PI*2)/12);
          ctx.beginPath();
          ctx.strokeStyle=`rgba(139,234,255,${0.06+(state.surge*0.16)})`;
          ctx.lineWidth=1;
          ctx.moveTo(100+(state.boost*30),0);
          ctx.lineTo((width*0.26)+(state.boost*90),0);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.shadowBlur=0;
      state.starRaf=requestAnimationFrame(render);
    };

    render();
  }

  function createCoreShards(THREE){
    const shardGroup=new THREE.Group();
    const geometry=new THREE.OctahedronGeometry(0.12,0);

    state.shards=Array.from({length:26},(_,index)=>{
      const material=new THREE.MeshStandardMaterial({
        color:0xa5ebff,
        emissive:0x4259ff,
        emissiveIntensity:1.25,
        roughness:0.18,
        metalness:0.68,
      });
      const shard=new THREE.Mesh(geometry,material);
      shard.userData={
        angle:(index/26)*Math.PI*2,
        radius:2.35+((index%6)*0.18),
        offset:index*0.24,
        height:(index%2===0?1:-1)*(0.18+(index%4)*0.06),
      };
      shard.scale.setScalar(0.72+((index%5)*0.16));
      shardGroup.add(shard);
      return shard;
    });

    return shardGroup;
  }

  function createParticleHalo(THREE){
    const count=260;
    const positions=new Float32Array(count*3);

    for(let index=0;index<count;index+=1){
      const radius=2.2+Math.random()*1.8;
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
      size:0.042,
      transparent:true,
      opacity:0.92,
      blending:THREE.AdditiveBlending,
      depthWrite:false,
    });

    state.particleField=new THREE.Points(geometry,material);
    return state.particleField;
  }

  function initThreeScene(page){
    if(!window.THREE)return;

    const container=page.querySelector('#cockpit-three-container');
    if(!container)return;
    container.innerHTML='';

    const THREE=window.THREE;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(42,1,0.1,80);
    camera.position.set(0,0,8.2);

    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.18;
    container.appendChild(renderer.domElement);

    const ambientLight=new THREE.AmbientLight(0x77c9ff,0.8);
    const pointLight=new THREE.PointLight(0x7be7ff,3.2,20,2);
    pointLight.position.set(0.2,0.4,5.6);
    const rimLight=new THREE.PointLight(0xb185ff,1.9,24,2);
    rimLight.position.set(-4.2,1.8,-1.5);
    scene.add(ambientLight,pointLight,rimLight);

    const coreGroup=new THREE.Group();

    const orbMaterial=new THREE.MeshPhysicalMaterial({
      color:0x84e7ff,
      emissive:0x2f58ff,
      emissiveIntensity:1.5,
      roughness:0.14,
      metalness:0.18,
      transmission:0.18,
      thickness:0.9,
      transparent:true,
      opacity:0.98,
    });

    const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(1.18,3),orbMaterial);

    const innerCore=new THREE.Mesh(
      new THREE.SphereGeometry(0.7,32,32),
      new THREE.MeshBasicMaterial({
        color:0xffda76,
        transparent:true,
        opacity:0.4,
        blending:THREE.AdditiveBlending,
      })
    );

    const shellMesh=new THREE.Mesh(
      new THREE.SphereGeometry(1.58,30,30),
      new THREE.MeshBasicMaterial({
        color:0xa87cff,
        transparent:true,
        opacity:0.09,
        wireframe:true,
      })
    );

    const ringSpecs=[
      {radius:1.95,tube:0.036,color:0x7ae9ff,emissive:0x2d85ff,rot:[Math.PI/2.6,Math.PI/7,0]},
      {radius:2.45,tube:0.05,color:0xa47eff,emissive:0x5d3cff,rot:[Math.PI/1.76,0,Math.PI/6]},
      {radius:1.42,tube:0.03,color:0xffd36b,emissive:0xc6842e,rot:[Math.PI/3.4,Math.PI/2.2,0]},
      {radius:2.86,tube:0.022,color:0xff73cb,emissive:0x8b2dff,rot:[Math.PI/2.2,Math.PI/4,Math.PI/9]},
    ];

    state.rings=ringSpecs.map(spec=>{
      const ring=new THREE.Mesh(
        new THREE.TorusGeometry(spec.radius,spec.tube,18,220),
        new THREE.MeshStandardMaterial({
          color:spec.color,
          emissive:spec.emissive,
          emissiveIntensity:1.28,
          roughness:0.18,
          metalness:0.72,
        })
      );
      ring.rotation.set(spec.rot[0],spec.rot[1],spec.rot[2]);
      coreGroup.add(ring);
      return ring;
    });

    coreGroup.add(orb,innerCore,shellMesh);
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
    state.shellMesh=shellMesh;
    state.pointLight=pointLight;
    state.ambientLight=ambientLight;
    state.rimLight=rimLight;
    state.resizeThree=resizeThree;
    resizeThree();

    const animate=()=>{
      if(!document.body.contains(page)||!page.classList.contains('active')){
        state.threeRaf=0;
        return;
      }

      const time=performance.now()*0.001;
      state.boost=Math.max(0,state.boost-0.022);
      state.surge=Math.max(0,state.surge-0.014);
      state.hueShift+=(0.14+(state.boost*0.34));

      state.mouseCurrent.x+=(state.mouseTarget.x-state.mouseCurrent.x)*0.05;
      state.mouseCurrent.y+=(state.mouseTarget.y-state.mouseCurrent.y)*0.05;

      const hueBase=(192+(Math.sin(time*0.22)*26)+(state.surge*90))%360;

      coreGroup.position.y=Math.sin(time*1.4)*0.22;
      coreGroup.position.x=state.mouseCurrent.x*0.38;
      coreGroup.rotation.y+=0.008+(state.boost*0.03);
      coreGroup.rotation.x=(Math.sin(time*0.76)*0.15)+(state.mouseCurrent.y*0.24);
      coreGroup.rotation.z=(Math.sin(time*0.42)*0.1)+(state.mouseCurrent.x*0.18);

      const orbScale=1+(state.boost*0.16)+(Math.sin(time*2.5)*0.04);
      orb.scale.setScalar(orbScale);
      shellMesh.scale.setScalar(1.02+(Math.sin(time*1.8)*0.03)+(state.boost*0.1));
      innerCore.scale.setScalar(1.08+(state.boost*0.24)+(Math.sin(time*3.2)*0.05));
      innerCore.material.opacity=0.32+(state.boost*0.24);

      orb.material.color.setHSL((hueBase%360)/360,0.82,0.58);
      orb.material.emissive.setHSL(((hueBase+28)%360)/360,0.92,0.34);
      orb.material.emissiveIntensity=1.4+(state.boost*2.1);
      shellMesh.material.color.setHSL(((hueBase+90)%360)/360,0.8,0.62);
      pointLight.color.setHSL((hueBase%360)/360,0.9,0.58);
      pointLight.intensity=3.2+(state.boost*3.1);
      rimLight.color.setHSL(((hueBase+80)%360)/360,0.82,0.52);

      state.rings.forEach((ring,index)=>{
        ring.rotation.x+=0.004+(index*0.0008)+(state.boost*0.01);
        ring.rotation.y+=((index%2===0?1:-1)*(0.006+(index*0.0007)))+(state.boost*0.008);
        ring.material.color.setHSL((((hueBase+(index*44))%360)/360),0.84,0.6);
        ring.material.emissive.setHSL((((hueBase+(index*64)+22)%360)/360),0.92,0.34);
        ring.material.emissiveIntensity=1.12+(state.boost*1.4);
      });

      state.shards.forEach((shard,index)=>{
        const angle=shard.userData.angle+(time*(0.28+(index*0.01)));
        const radius=shard.userData.radius+(Math.sin(time+shard.userData.offset)*0.12)+(state.boost*0.28);
        shard.position.x=Math.cos(angle)*radius;
        shard.position.z=Math.sin(angle)*radius*0.58;
        shard.position.y=(Math.sin(time*1.3+shard.userData.offset)*0.46)+shard.userData.height;
        shard.rotation.x+=0.024;
        shard.rotation.y+=0.018;
        shard.material.color.setHSL((((hueBase+index*8)%360)/360),0.88,0.68);
      });

      if(state.particleField&&state.particlePositions&&state.particleBase){
        const positions=state.particlePositions;
        const base=state.particleBase;
        for(let index=0;index<positions.length;index+=3){
          const wave=1+(state.boost*0.32*Math.sin((index*0.08)+time*4.2));
          positions[index]=base[index]*wave;
          positions[index+1]=base[index+1]*(1+(state.boost*0.2*Math.cos((index*0.06)+time*3.2)));
          positions[index+2]=base[index+2]*wave;
        }
        state.particleField.geometry.attributes.position.needsUpdate=true;
        state.particleField.rotation.y-=0.0035;
        state.particleField.rotation.x+=0.0014;
        state.particleField.material.color.setHSL((((hueBase+40)%360)/360),0.9,0.72);
      }

      camera.position.x=state.mouseCurrent.x*0.92;
      camera.position.y=state.mouseCurrent.y*0.48;
      camera.position.z=8-(state.boost*0.32);
      camera.lookAt(coreGroup.position);
      renderer.render(scene,camera);
      state.threeRaf=requestAnimationFrame(animate);
    };

    animate();
  }

  function emitPointerFragment(page,x,y,relX,relY){
    const now=performance.now();
    if(now-state.pointerTrailStamp<42)return;
    state.pointerTrailStamp=now;

    const layer=page.querySelector('#cockpit-fx-layer');
    if(!layer)return;
    const fragment=document.createElement('span');
    fragment.className='pointer-fragment';
    fragment.style.left=`${x}px`;
    fragment.style.top=`${y}px`;
    fragment.style.transform=`translate(-50%,-50%) rotate(${Math.atan2(relY||0.001,relX||0.001)*(180/Math.PI)}deg)`;
    layer.appendChild(fragment);
    fragment.animate([
      { opacity:0.82, transform:`translate(-50%,-50%) rotate(${Math.atan2(relY||0.001,relX||0.001)*(180/Math.PI)}deg) scaleX(1)` },
      { opacity:0, transform:`translate(calc(-50% + ${relX*24}px), calc(-50% + ${relY*24}px)) rotate(${Math.atan2(relY||0.001,relX||0.001)*(180/Math.PI)}deg) scaleX(0.2)` },
    ],{duration:420,easing:'ease-out',fill:'forwards'});
    setTimeout(()=>fragment.remove(),460);
  }

  function initParallax(page){
    state.pointerMoveHandler=event=>{
      const rect=page.getBoundingClientRect();
      const relX=((event.clientX-rect.left)/Math.max(rect.width,1))-0.5;
      const relY=((event.clientY-rect.top)/Math.max(rect.height,1))-0.5;
      state.mouseTarget.x=relX;
      state.mouseTarget.y=relY;

      page.style.setProperty('--pointer-x',`${(((relX+0.5)*100)).toFixed(2)}%`);
      page.style.setProperty('--pointer-y',`${(((relY+0.5)*100)).toFixed(2)}%`);

      page.querySelectorAll('.parallax-bg').forEach(node=>{
        node.style.transform=`translate3d(${(-relX*30).toFixed(2)}px,${(-relY*22).toFixed(2)}px,0)`;
      });
      page.querySelectorAll('.parallax-mid').forEach(node=>{
        node.style.transform=`translate3d(${(-relX*18).toFixed(2)}px,${(-relY*16).toFixed(2)}px,0)`;
      });
      page.querySelectorAll('.parallax-fg').forEach(node=>{
        node.style.transform=`translate3d(${(-relX*12).toFixed(2)}px,${(-relY*8).toFixed(2)}px,0)`;
      });
      page.querySelectorAll('.cockpit-floating-glyph').forEach((node,index)=>{
        node.style.transform=`translate3d(${(relX*(index%2===0?-12:12)).toFixed(2)}px,${(relY*(index%3===0?-16:16)).toFixed(2)}px,0)`;
      });
      page.querySelectorAll('.cockpit-whisper').forEach((node,index)=>{
        node.style.transform=`translate3d(${(relX*(index%2===0?-10:10)).toFixed(2)}px,${(relY*(index===1?-14:14)).toFixed(2)}px,0)`;
      });
      emitPointerFragment(page,event.clientX-rect.left,event.clientY-rect.top,relX,relY);
    };

    state.pointerLeaveHandler=()=>{
      state.mouseTarget.x=0;
      state.mouseTarget.y=0;
      page.style.setProperty('--pointer-x','50%');
      page.style.setProperty('--pointer-y','50%');
      page.querySelectorAll('.cockpit-stellar-layer, .cockpit-floating-glyph, .cockpit-whisper').forEach(node=>{
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

  function emitParticleBurst(page,x,y,options={}){
    const layer=page.querySelector('#cockpit-fx-layer');
    if(!layer)return;
    const count=options.count||18;
    const gold=Boolean(options.gold);

    for(let index=0;index<count;index+=1){
      const particle=document.createElement('span');
      particle.className='dashboard-particle';
      particle.style.left=`${x}px`;
      particle.style.top=`${y}px`;
      if(gold){
        particle.style.background='radial-gradient(circle, rgba(255,255,255,0.98), rgba(255,212,111,0.88))';
        particle.style.boxShadow='0 0 14px rgba(255,212,111,0.45)';
      }
      layer.appendChild(particle);

      const angle=(index/count)*Math.PI*2;
      const distance=30+Math.random()*(gold?88:64);
      const duration=480+Math.random()*260;
      particle.animate([
        { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
        { transform:`translate(calc(-50% + ${Math.cos(angle)*distance}px), calc(-50% + ${Math.sin(angle)*distance}px)) scale(0)`, opacity:0 },
      ],{duration,easing:'cubic-bezier(0.22,1,0.36,1)',fill:'forwards'});
      setTimeout(()=>particle.remove(),duration+30);
    }

    const burst=document.createElement('span');
    burst.className='cockpit-light-burst';
    burst.style.left=`${x}px`;
    burst.style.top=`${y}px`;
    layer.appendChild(burst);
    burst.animate([
      { opacity:0.92, transform:'translate(-50%,-50%) scale(0.3)' },
      { opacity:0, transform:'translate(-50%,-50%) scale(1.24)' },
    ],{duration:560,easing:'ease-out',fill:'forwards'});
    setTimeout(()=>burst.remove(),620);
  }

  function emitWarpLines(page,x,y,count=14){
    const layer=page.querySelector('#cockpit-fx-layer');
    if(!layer)return;

    for(let index=0;index<count;index+=1){
      const line=document.createElement('span');
      const angle=(index/count)*360+(Math.random()*16)-8;
      line.className='cockpit-warp-line';
      line.style.left=`${x}px`;
      line.style.top=`${y}px`;
      line.style.transform=`translate(-50%,-50%) rotate(${angle}deg)`;
      layer.appendChild(line);
      line.animate([
        { opacity:0.9, transform:`translate(-50%,-50%) rotate(${angle}deg) scaleX(0.08)` },
        { opacity:0, transform:`translate(-50%,-50%) rotate(${angle}deg) scaleX(${1.1+Math.random()*0.7})` },
      ],{duration:620+Math.random()*180,easing:'ease-out',fill:'forwards'});
      setTimeout(()=>line.remove(),860);
    }
  }

  function emitFlashRing(page,x,y){
    const layer=page.querySelector('#cockpit-fx-layer');
    if(!layer)return;
    const ring=document.createElement('span');
    ring.className='cockpit-flash-ring';
    ring.style.left=`${x}px`;
    ring.style.top=`${y}px`;
    layer.appendChild(ring);
    ring.animate([
      { opacity:0.84, transform:'translate(-50%,-50%) scale(0.24)' },
      { opacity:0, transform:'translate(-50%,-50%) scale(1.8)' },
    ],{duration:720,easing:'cubic-bezier(0.16,1,0.3,1)',fill:'forwards'});
    setTimeout(()=>ring.remove(),760);
  }

  function spawnXpFloat(page,text,anchor){
    const layer=page.querySelector('#cockpit-fx-layer');
    if(!layer)return;

    const pageRect=page.getBoundingClientRect();
    const point=anchor&&anchor.left!=null?anchor:anchor&&typeof anchor.getBoundingClientRect==='function'?anchor.getBoundingClientRect():null;
    if(!point)return;
    const x=(point.left-pageRect.left)+(point.width?point.width/2:0);
    const y=(point.top-pageRect.top)+(point.height?point.height/2:0);
    const floatEl=document.createElement('span');
    floatEl.className='cockpit-xp-float';
    floatEl.textContent=text;
    floatEl.style.left=`${x}px`;
    floatEl.style.top=`${y}px`;
    layer.appendChild(floatEl);

    if(window.gsap){
      gsap.fromTo(floatEl,{opacity:0,y:10,scale:0.88},{opacity:1,y:-10,scale:1,duration:0.38,ease:'power2.out'});
      gsap.to(floatEl,{opacity:0,y:-44,duration:0.64,delay:0.34,ease:'power2.in'});
      setTimeout(()=>floatEl.remove(),1050);
      return;
    }

    floatEl.animate([
      { opacity:0, transform:'translateY(10px) scale(0.88)' },
      { opacity:1, transform:'translateY(-10px) scale(1)' },
      { opacity:0, transform:'translateY(-44px) scale(1.03)' },
    ],{duration:980,easing:'ease-out',fill:'forwards'});
    setTimeout(()=>floatEl.remove(),1040);
  }

  function flashWarpOverlay(page,intensity){
    const overlay=page.querySelector('#cockpit-warp-overlay');
    if(!overlay)return;
    if(window.gsap){
      gsap.killTweensOf(overlay);
      gsap.fromTo(overlay,{opacity:0.08+(intensity*0.18),scale:0.96},{opacity:0,scale:1.06,duration:0.54,ease:'power2.out'});
      return;
    }
    overlay.animate([
      { opacity:0.08+(intensity*0.18), transform:'scale(0.96)' },
      { opacity:0, transform:'scale(1.06)' },
    ],{duration:540,easing:'ease-out',fill:'forwards'});
  }

  function pulseCore(page,intensity){
    page.classList.add('cockpit-boost');
    if(state.boostTimer)clearTimeout(state.boostTimer);
    state.boostTimer=setTimeout(()=>page.classList.remove('cockpit-boost'),640);
    state.boost=Math.max(state.boost,0.72*intensity);
    state.surge=Math.max(state.surge,0.9*intensity);

    if(window.gsap&&state.coreGroup){
      gsap.killTweensOf(state.coreGroup.scale);
      gsap.fromTo(
        state.coreGroup.scale,
        {x:1,y:1,z:1},
        {
          x:1.12+(intensity*0.06),
          y:1.12+(intensity*0.06),
          z:1.12+(intensity*0.06),
          duration:0.22,
          yoyo:true,
          repeat:1,
          ease:'power2.out',
        }
      );
    }
  }

  function scrambleReadouts(page,duration=1600){
    if(state.scrambleInterval)clearInterval(state.scrambleInterval);
    const prompt=page.querySelector('#cockpit-core-prompt');
    const started=performance.now();

    state.scrambleInterval=setInterval(()=>{
      const elapsed=performance.now()-started;
      const energy=Math.max(1,Math.floor(randomBetween(1,10)));
      const focus=Math.floor(randomBetween(18,100));
      setText(page,'#cockpit-energy-value',`${typeof toAr==='function'?toAr(energy):energy}/١٠`);
      setText(page,'#cockpit-focus-value',`${typeof toAr==='function'?toAr(focus):focus}٪`);
      setText(page,'#cockpit-ship-mode',randomChoice(['Nova Bloom','Echo Drift','Null Spin','Prism Surge']));
      if(prompt)prompt.textContent=randomChoice(['Signal rupture','Field collapse','Color leak','Gravity bloom']);
      if(elapsed>=duration){
        clearInterval(state.scrambleInterval);
        state.scrambleInterval=0;
        updateHomeReadouts(page,{boost:false});
        updateAmbientLabels(page);
      }
    },110);
  }

  function getAnchorPoint(page,selector){
    const node=page.querySelector(selector);
    return node?node.getBoundingClientRect():null;
  }

  function triggerCockpitChaos(kind='core'){
    const page=activeHomePage();
    if(!page)return;
    const pageRect=page.getBoundingClientRect();
    const selectorMap={
      core:'#cockpit-core-trigger',
      xp:'#cockpit-xp-trigger',
      void:'#cockpit-void-trigger',
      mission:'#cockpit-mission-toggle',
    };
    const anchorRect=getAnchorPoint(page,selectorMap[kind]||'#cockpit-core-trigger');
    if(!anchorRect)return;

    const x=anchorRect.left-pageRect.left+(anchorRect.width/2);
    const y=anchorRect.top-pageRect.top+(anchorRect.height/2);
    const intensity=kind==='core'?1.35:kind==='void'?1.05:0.88;

    pulseCore(page,intensity);
    flashWarpOverlay(page,intensity);
    emitParticleBurst(page,x,y,{count:kind==='core'?34:kind==='xp'?22:18,gold:kind==='xp'});
    emitWarpLines(page,x,y,kind==='core'?20:12);
    emitFlashRing(page,x,y);
    if(typeof state.spawnMeteor==='function')state.spawnMeteor(kind==='core'?3:1,kind==='core');
    scrambleReadouts(page,kind==='core'?1900:1100);

    if(kind==='xp'){
      spawnXpFloat(page,'+15 XP',anchorRect);
      spawnXpFloat(page,'+05 XP',anchorRect);
    }else if(kind==='void'){
      spawnXpFloat(page,'VOID',anchorRect);
    }else{
      spawnXpFloat(page,'IGNITION',anchorRect);
    }
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

    page.querySelectorAll('#cockpit-core-trigger').forEach(node=>{
      if(node.dataset.sceneBound==='true')return;
      node.dataset.sceneBound='true';
      node.addEventListener('pointerdown',()=>{
        if(window.gsap){
          gsap.fromTo(node,{scale:1},{scale:0.94,duration:0.12,yoyo:true,repeat:1,ease:'power1.out'});
        }
      },{passive:true});
    });
  }

  function applyMissionDrawerState(page,open){
    state.drawerOpen=Boolean(open);
    page.classList.toggle('mission-open',state.drawerOpen);
  }

  function openMissionDrawer(){
    const page=activeHomePage();
    if(page)applyMissionDrawerState(page,true);
  }

  function closeMissionDrawer(){
    const page=getHomePage();
    if(page)applyMissionDrawerState(page,false);
  }

  function toggleMissionDrawer(){
    const page=activeHomePage();
    if(page)applyMissionDrawerState(page,!state.drawerOpen);
  }

  function handleTaskToggle(event){
    const page=activeHomePage();
    if(!page)return;

    const task=page.querySelector(`.cockpit-task[data-task-index="${event.detail.index}"]`);
    if(task){
      task.classList.remove('cockpit-task-boost');
      void task.offsetWidth;
      task.classList.add('cockpit-task-boost');
      setTimeout(()=>task.classList.remove('cockpit-task-boost'),720);
    }

    const pageRect=page.getBoundingClientRect();
    const anchor=task||page.querySelector('#cockpit-mission-toggle');
    if(anchor){
      const rect=anchor.getBoundingClientRect();
      const x=rect.left-pageRect.left+(rect.width/2);
      const y=rect.top-pageRect.top+(rect.height/2);
      emitParticleBurst(page,x,y,{count:event.detail.checked?20:12,gold:event.detail.checked});
      emitWarpLines(page,x,y,event.detail.checked?10:6);
      emitFlashRing(page,x,y);
      if(event.detail.checked)spawnXpFloat(page,'+10 XP',rect);
    }

    pulseCore(page,event.detail.checked?1.1:0.52);
    if(event.detail.checked&&typeof state.spawnMeteor==='function')state.spawnMeteor(2,false);
    updateHomeReadouts(page,{boost:event.detail.checked});
  }

  function initAmbientLoops(page){
    updateAmbientLabels(page);

    rememberInterval(setInterval(()=>{
      if(!page.classList.contains('active'))return;
      updateAmbientLabels(page);
      if(typeof state.spawnMeteor==='function'&&Math.random()<0.72)state.spawnMeteor(1,false);
    },3000));

    rememberInterval(setInterval(()=>{
      if(!page.classList.contains('active'))return;
      pulseCore(page,0.34+Math.random()*0.18);
    },4200));
  }

  function initCockpitEntrance(page){
    if(!window.gsap)return;
    const hero=page.querySelector('.cockpit-hero-stage');
    const coreStage=page.querySelector('.cockpit-core-stage');

    const greeting=page.querySelector('#home-greeting');
    const subtitle=page.querySelector('#home-sub');
    const targets=[hero,coreStage].filter(Boolean);
    gsap.killTweensOf(targets);
    gsap.set(targets,{opacity:0,y:26,scale:0.985});
    gsap.set([greeting,subtitle],{opacity:0,y:12,filter:'blur(10px)'});

    const tl=gsap.timeline({defaults:{ease:'power3.out'}});
    tl.to(greeting,{opacity:1,y:0,filter:'blur(0px)',duration:0.78});
    tl.to(subtitle,{opacity:1,y:0,filter:'blur(0px)',duration:0.54},'-=0.46');
    tl.to(targets,{
      opacity:1,
      y:0,
      scale:1,
      duration:0.82,
      stagger:0.05,
      clearProps:'opacity,transform,filter',
    },'-=0.28');
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
    rememberTimeout(setTimeout(()=>{
      if(typeof state.resizeCanvas==='function')state.resizeCanvas();
      if(typeof state.resizeThree==='function')state.resizeThree();
    },320));
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
    if(app)setSidebarCollapsed(!app.classList.contains('sidebar-collapsed'));
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
    if(app)setSidebarHidden(!app.classList.contains('sidebar-hidden'));
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
    updateAmbientLabels(page);
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
    initAmbientLoops(page);
    updateHomeReadouts(page);

    state.keyHandler=event=>{
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
  window.triggerCockpitChaos=triggerCockpitChaos;
  window.dashboardCockpitInit=dashboardCockpitInit;
  window.dashboardCockpitRefresh=dashboardCockpitRefresh;
})();
