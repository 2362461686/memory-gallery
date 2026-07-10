"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, Float, Text, Html } from "@react-three/drei";
import { EffectComposer, Outline, Bloom } from "@react-three/postprocessing";
import { Suspense, useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { BlendFunction } from "postprocessing";

interface Exhibit {
  id: string;
  contentText: string | null;
  mediaUrls: string;
  contentType: string;
  aiCategory: string | null;
  aiTags: string | null;
  aiSentiment: string | null;
  aiDescription: string | null;
  postedAt: Date | null;
}

interface AnimeGalleryProps {
  exhibits: Exhibit[];
  exhibitionTitle: string;
}

function WallTexture({ exhibits, offset }: { exhibits: Exhibit[]; offset: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Anime-style wall background
    const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
    gradient.addColorStop(0, "#2a1a3e");
    gradient.addColorStop(0.5, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    // Grid pattern (picture frames)
    ctx.strokeStyle = "rgba(255, 200, 240, 0.2)";
    ctx.lineWidth = 1;

    const cols = 4;
    const rows = 2;
    const padding = 40;
    const cellW = (1024 - padding * (cols + 1)) / cols;
    const cellH = (512 - padding * (rows + 1)) / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = padding + col * (cellW + padding);
        const y = padding + row * (cellH + padding);

        // Frame
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(x, y, cellW, cellH);
        // Border
        ctx.strokeStyle = "rgba(255, 180, 220, 0.3)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellW, cellH);

        // Placeholder content
        if (row * cols + col < exhibits.length) {
          ctx.fillStyle = "rgba(255, 200, 240, 0.15)";
          ctx.fillRect(x + 4, y + 4, cellW - 8, cellH - 8);
        }
      }
    }

    return new THREE.CanvasTexture(canvas);
  }, [exhibits]);

  return (
    <mesh position={[0, 0, offset]} receiveShadow>
      <planeGeometry args={[10, 5]} />
      <meshToonMaterial map={texture} />
    </mesh>
  );
}

function ExhibitFrameImage({
  url,
  position,
  exhibit,
  onClick,
}: {
  url: string;
  position: [number, number, number];
  exhibit: Exhibit;
  onClick: (exhibit: Exhibit) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(1.1, 1.1, 1.1),
        0.1
      );
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(1, 1, 1),
        0.1
      );
    }
  });

  const texture = useMemo(() => new THREE.TextureLoader().load(url), [url]);

  return (
    <Float speed={2} rotationIntensity={0.02} floatIntensity={0.3}>
      <group
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(exhibit)}
      >
        {/* Frame */}
        <mesh position={[0, 0, -0.1]} castShadow>
          <boxGeometry args={[1.4, 1.4, 0.1]} />
          <meshToonMaterial color="#3d2b5a" />
        </mesh>
        {/* Image */}
        <mesh ref={meshRef}>
          <planeGeometry args={[1.2, 1.2]} />
          <meshToonMaterial map={texture} />
        </mesh>
        {/* Category badge */}
        <Html position={[0, -0.8, 0.1]} center style={{ pointerEvents: "none" }}>
          <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/80 text-white font-medium whitespace-nowrap backdrop-blur-sm">
            {exhibit.aiCategory || "生活"}
          </span>
        </Html>
      </group>
    </Float>
  );
}

function GalleryScene({ exhibits, onExhibitClick }: {
  exhibits: Exhibit[];
  onExhibitClick: (exhibit: Exhibit) => void;
}) {
  // Build positions for exhibits in a room layout
  const positions = useMemo(() => {
    const pos: { exhibit: Exhibit; position: [number, number, number]; rotation: [number, number, number] }[] = [];
    const wallZ = -3;
    const cols = 5;
    const spacing = 1.6;
    const startX = -((cols - 1) * spacing) / 2;
    const rowHeights = [2.5, 0.5, -1.5];

    exhibits.forEach((exhibit, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      pos.push({
        exhibit,
        position: [
          startX + col * spacing,
          rowHeights[row % rowHeights.length],
          wallZ,
        ] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
      });
    });

    return pos;
  }, [exhibits]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 4, 0]} intensity={0.8} color="#ffc8e0" />
      <pointLight position={[-3, 2, -2]} intensity={0.5} color="#c8e0ff" />
      <pointLight position={[3, 2, -2]} intensity={0.5} color="#e0ffc8" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, -3]} receiveShadow>
        <planeGeometry args={[15, 10]} />
        <meshToonMaterial color="#1a1a2e" />
      </mesh>

      {/* Back wall with texture */}
      <WallTexture exhibits={exhibits} offset={-4} />

      {/* Exhibition frames */}
      {positions.map(({ exhibit, position }) => {
        const urls: string[] = JSON.parse(exhibit.mediaUrls || "[]");
        const imageUrl = urls[0] || "/placeholder.jpg";

        return (
          <ExhibitFrameImage
            key={exhibit.id}
            url={imageUrl}
            position={position}
            exhibit={exhibit}
            onClick={onExhibitClick}
          />
        );
      })}

      {/* Exhibition title sign */}
      <Text
        position={[0, 4, -3.5]}
        fontSize={0.4}
        color="#ffa0d0"
        anchorY="top"
        anchorX="center"
        font="https://fonts.gstatic.com/s/notoserifsc/v21/H4c8BXePl9DZ0Xe7gG9cyOj7mm63SzZBEtERe7Y.otf"
      >
        ✦ EXHIBITION ✦
      </Text>

      {/* Post-processing */}
      <EffectComposer>
        <Outline
          selection={[]}
          visibleEdgeColor={0xffa0d0}
          hiddenEdgeColor={0xffa0d0}
          blur={false}
          edgeStrength={5}
        />
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          blendFunction={BlendFunction.SCREEN}
        />
      </EffectComposer>

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 0, -3]}
      />
      <Environment preset="night" />
    </>
  );
}

function ExhibitDetail({ exhibit, onClose }: { exhibit: Exhibit; onClose: () => void }) {
  const urls: string[] = JSON.parse(exhibit.mediaUrls || "[]");
  const tags: string[] = JSON.parse(exhibit.aiTags || "[]");

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-b from-[#1a1025]/95 to-[#0d1525]/95 backdrop-blur-xl border-l border-pink-500/20 p-6 overflow-y-auto z-20 text-white">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {urls[0] && (
        <img src={urls[0]} alt="" className="w-full rounded-xl mb-4 mt-2" />
      )}

      <h3 className="text-lg font-semibold text-pink-300 mb-2">
        {exhibit.aiDescription || "展品"}
      </h3>

      {exhibit.contentText && (
        <p className="text-sm text-zinc-300 mb-4 leading-relaxed">{exhibit.contentText}</p>
      )}

      {exhibit.aiCategory && (
        <div className="mb-3">
          <span className="text-xs text-zinc-500">主题</span>
          <div className="mt-1">
            <span className="inline-block px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-sm">
              {exhibit.aiCategory}
            </span>
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-zinc-500">标签</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {exhibit.aiSentiment && (
        <div className="mb-3">
          <span className="text-xs text-zinc-500">情绪</span>
          <p className="mt-1 text-sm text-zinc-300">
            {exhibit.aiSentiment === "positive" ? "😊 积极" : exhibit.aiSentiment === "negative" ? "😢 低落" : "😐 中性"}
          </p>
        </div>
      )}

      {exhibit.postedAt && (
        <div>
          <span className="text-xs text-zinc-500">时间</span>
          <p className="mt-1 text-sm text-zinc-400">
            {new Date(exhibit.postedAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AnimeGallery({ exhibits, exhibitionTitle }: AnimeGalleryProps) {
  const [selectedExhibit, setSelectedExhibit] = useState<Exhibit | null>(null);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-pink-500/20 shadow-2xl shadow-purple-900/30">
      <Canvas camera={{ position: [0, 1, 5], fov: 50 }} shadows>
        <Suspense fallback={null}>
          <GalleryScene
            exhibits={exhibits.slice(0, 15)}
            onExhibitClick={setSelectedExhibit}
          />
        </Suspense>
      </Canvas>

      {selectedExhibit && (
        <ExhibitDetail
          exhibit={selectedExhibit}
          onClose={() => setSelectedExhibit(null)}
        />
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-xs text-white/40 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
        拖拽旋转 | 滚轮缩放 | 右键平移 | 点击展品查看详情
      </div>
    </div>
  );
}
