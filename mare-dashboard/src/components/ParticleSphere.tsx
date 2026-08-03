'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ParticleSphere() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Setup
    const container = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 4000);
    camera.position.z = 1750;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Particles Data
    const maxParticleCount = 500;
    const r = 800;
    const rHalf = r / 2;

    // Bounding Box / Helper
    const helperGeometry = new THREE.IcosahedronGeometry(rHalf * 1.5, 1);
    const helperMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
    const helper = new THREE.LineSegments(new THREE.WireframeGeometry(helperGeometry), helperMaterial);
    group.add(helper);

    const segments = maxParticleCount * maxParticleCount;
    const positions = new Float32Array(segments * 3);
    const colors = new Float32Array(segments * 3);

    const particlePositions = new Float32Array(maxParticleCount * 3);
    const particleData: any[] = [];

    for (let i = 0; i < maxParticleCount; i++) {
      const x = Math.random() * r - r / 2;
      const y = Math.random() * r - r / 2;
      const z = Math.random() * r - r / 2;

      // Make them spherical but push them outward to leave the center hollow
      const radius = rHalf * 0.5 + Math.random() * rHalf * 0.7;
      const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(radius);

      particlePositions[i * 3] = v.x;
      particlePositions[i * 3 + 1] = v.y;
      particlePositions[i * 3 + 2] = v.z;

      particleData.push({
        velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
        numConnections: 0
      });
    }

    const pMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      blending: THREE.AdditiveBlending,
      transparent: true,
      sizeAttenuation: false
    });
    const pGeometry = new THREE.BufferGeometry();
    pGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleSystem = new THREE.Points(pGeometry, pMaterial);
    group.add(particleSystem);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));

    lineGeometry.computeBoundingSphere();
    lineGeometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const linesMesh = new THREE.LineSegments(lineGeometry, material);
    group.add(linesMesh);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const effectController = {
      minDistance: 150,
      limitConnections: false,
      maxConnections: 20
    };

    const animate = () => {
      let vertexpos = 0;
      let colorpos = 0;
      let numConnected = 0;

      for (let i = 0; i < maxParticleCount; i++)
        particleData[i].numConnections = 0;

      for (let i = 0; i < maxParticleCount; i++) {
        const particleDataA = particleData[i];

        particlePositions[i * 3] += particleDataA.velocity.x;
        particlePositions[i * 3 + 1] += particleDataA.velocity.y;
        particlePositions[i * 3 + 2] += particleDataA.velocity.z;

        if (particlePositions[i * 3 + 1] < -rHalf || particlePositions[i * 3 + 1] > rHalf)
          particleDataA.velocity.y = -particleDataA.velocity.y;

        if (particlePositions[i * 3] < -rHalf || particlePositions[i * 3] > rHalf)
          particleDataA.velocity.x = -particleDataA.velocity.x;

        if (particlePositions[i * 3 + 2] < -rHalf || particlePositions[i * 3 + 2] > rHalf)
          particleDataA.velocity.z = -particleDataA.velocity.z;

        if (effectController.limitConnections && particleDataA.numConnections >= effectController.maxConnections)
          continue;

        for (let j = i + 1; j < maxParticleCount; j++) {
          const particleDataB = particleData[j];
          if (effectController.limitConnections && particleDataB.numConnections >= effectController.maxConnections)
            continue;

          const dx = particlePositions[i * 3] - particlePositions[j * 3];
          const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
          const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < effectController.minDistance) {
            particleDataA.numConnections++;
            particleDataB.numConnections++;

            const alpha = 1.0 - dist / effectController.minDistance;

            positions[vertexpos++] = particlePositions[i * 3];
            positions[vertexpos++] = particlePositions[i * 3 + 1];
            positions[vertexpos++] = particlePositions[i * 3 + 2];

            positions[vertexpos++] = particlePositions[j * 3];
            positions[vertexpos++] = particlePositions[j * 3 + 1];
            positions[vertexpos++] = particlePositions[j * 3 + 2];

            colors[colorpos++] = alpha * 0.8;
            colors[colorpos++] = alpha * 0.8;
            colors[colorpos++] = alpha * 0.8; // Light gray

            colors[colorpos++] = alpha * 0.8;
            colors[colorpos++] = alpha * 0.8;
            colors[colorpos++] = alpha * 0.8;
            numConnected++;
          }
        }
      }

      lineGeometry.setDrawRange(0, numConnected * 2);
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
      pGeometry.attributes.position.needsUpdate = true;

      // Group rotation independent of cursor
      group.rotation.y += 0.002;
      group.rotation.x += 0.001;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 opacity-25 pointer-events-none" />;
}
