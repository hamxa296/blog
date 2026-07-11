import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export const PixelRocketHero: React.FC = () => {
  const textControls = useAnimation();
  const buttonControls = useAnimation();

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    textControls.start((i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05 + 1.5,
        duration: 1.2,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    }));
    buttonControls.start({
      opacity: 1,
      transition: { delay: 2.5, duration: 1 },
    });

    return () => {
      document.head.removeChild(link);
    };
  }, [textControls, buttonControls]);

  const headline = 'GIKI Chronicles';

  return (
    <div
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-sky-100 dark:bg-[#1a0033]"
      style={{ fontFamily: "'Press Start 2P', system-ui" }}
    >
      <PixelVoyagerCanvas />
      <HeroNav />
      <div className="relative z-10 text-center px-4">
        <h1
          className="text-3xl sm:text-5xl font-bold tracking-tighter text-slate-900 dark:text-white md:text-7xl"
          style={{ textShadow: '3px 3px 0px #ff00ff' }}
        >
          {headline.split('').map((char, i) => (
            <motion.span
              key={i}
              custom={i}
              initial={{ opacity: 0, y: 50 }}
              animate={textControls}
              style={{ display: 'inline-block' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </h1>
        <motion.p
          custom={headline.length}
          initial={{ opacity: 0, y: 30 }}
          animate={textControls}
          className="mx-auto mt-6 max-w-xl text-xs sm:text-base leading-relaxed text-slate-600 dark:text-slate-300"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Student life, engineering tales, and campus stories from the Valley. Your cosmic guide to GIK Institute.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={buttonControls}
          className="mt-10 flex flex-wrap gap-4 justify-center"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          <Link
            to="/guide"
            className="rounded-none border-2 border-slate-800 bg-white px-6 sm:px-8 py-3 sm:py-4 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-200 dark:border-white dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            Freshman Guide
          </Link>
          <Link
            to="/browse"
            className="rounded-none border-2 border-slate-800 bg-transparent px-6 sm:px-8 py-3 sm:py-4 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-800 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            Browse Chronicles
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

const HeroNav = () => (
  <motion.nav
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { delay: 1, duration: 1 } }}
    className="absolute top-0 left-0 right-0 z-20 p-6"
  >
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-2xl font-bold text-cyan-500 dark:text-cyan-300">🚀</span>
        <span className="text-sm sm:text-xl font-bold text-slate-800 dark:text-white">GIKI Chronicles</span>
      </Link>
    </div>
  </motion.nav>
);

const PixelVoyagerCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0;
    bloomPass.strength = isDarkMode ? 1.2 : 0.6;
    bloomPass.radius = 0;
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const starGeometry = new THREE.BufferGeometry();
    const starVertices: number[] = [];
    for (let i = 0; i < 1500; i++) {
      starVertices.push(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: isDarkMode ? 0xffffff : 0x555555,
      size: 0.1,
    });
    scene.add(new THREE.Points(starGeometry, starMaterial));

    const rocket = new THREE.Group();
    const pixelSize = 0.2;
    const pixelGeo = new THREE.BoxGeometry(pixelSize, pixelSize, pixelSize);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00aaff, flatShading: true });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0055ff, flatShading: true });
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      emissive: 0x87ceeb,
      emissiveIntensity: 0.5,
    });

    for (let y = -4; y < 5; y++)
      for (let x = -2; x < 3; x++) {
        if (Math.abs(x) === 2 && y > 1) continue;
        const pixel = new THREE.Mesh(pixelGeo, bodyMat);
        pixel.position.set(x * pixelSize, y * pixelSize, 0);
        rocket.add(pixel);
      }
    for (let y = -3; y < -1; y++)
      for (let x = -4; x < -2; x++) {
        const pixelL = new THREE.Mesh(pixelGeo, wingMat);
        pixelL.position.set(x * pixelSize, y * pixelSize, 0);
        rocket.add(pixelL);
        const pixelR = new THREE.Mesh(pixelGeo, wingMat);
        pixelR.position.set(-x * pixelSize, y * pixelSize, 0);
        rocket.add(pixelR);
      }
    const cockpit = new THREE.Mesh(pixelGeo, cockpitMat);
    cockpit.position.set(0, 3 * pixelSize, pixelSize);
    rocket.add(cockpit);
    scene.add(rocket);

    const trailPool: THREE.Mesh[] = [];
    let trailIndex = 0;
    const trailSize = 200;
    const trailGeo = new THREE.BoxGeometry(pixelSize * 1.5, pixelSize * 1.5, pixelSize * 1.5);
    for (let i = 0; i < trailSize; i++) {
      const trailMat = new THREE.MeshBasicMaterial({
        color:
          Math.random() > 0.5
            ? isDarkMode
              ? 0xff00ff
              : 0xff4500
            : isDarkMode
              ? 0xee82ee
              : 0xffa500,
      });
      const particle = new THREE.Mesh(trailGeo, trailMat);
      particle.visible = false;
      scene.add(particle);
      trailPool.push(particle);
    }

    const coinGroup = new THREE.Group();
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, flatShading: true });
    for (let i = 0; i < 20; i++) {
      const coin = new THREE.Group();
      for (let p = 0; p < 15; p++) {
        const pixel = new THREE.Mesh(pixelGeo, coinMat);
        const angle = (p / 15) * Math.PI * 2;
        pixel.position.set(Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0);
        coin.add(pixel);
      }
      coin.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20
      );
      coinGroup.add(coin);
    }
    scene.add(coinGroup);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      const targetPosition = new THREE.Vector3(mouse.x * 15, mouse.y * 10, 0);
      rocket.position.lerp(targetPosition, 0.05);
      rocket.rotation.y = (targetPosition.x - rocket.position.x) * 0.1;
      rocket.rotation.x = -(targetPosition.y - rocket.position.y) * 0.1;

      if (Math.random() > 0.3) {
        const particle = trailPool[trailIndex];
        particle.position.copy(rocket.position);
        particle.position.y -= 0.7;
        particle.scale.setScalar(1);
        particle.visible = true;
        (particle as THREE.Mesh & { life: number }).life = 1;
        trailIndex = (trailIndex + 1) % trailSize;
      }

      trailPool.forEach((p) => {
        const particle = p as THREE.Mesh & { life: number };
        if (particle.visible) {
          particle.life -= delta * 1.5;
          particle.scale.setScalar(particle.life);
          if (particle.life <= 0) particle.visible = false;
        }
      });

      coinGroup.children.forEach((coin, i) => {
        coin.rotation.z = elapsedTime * (i % 2 === 0 ? 1 : -1);
      });

      composer.render();
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};
