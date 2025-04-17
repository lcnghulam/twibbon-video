"use client";

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useScrollToRef } from "@/hooks/scrollToRef";
import * as THREE from "three";
import { Canvas as R3FCanvas, useFrame } from "@react-three/fiber";

//
// Komponen UpdateTexture untuk memastikan video texture terupdate tiap frame
//
function UpdateTexture({ videoTexture }: { videoTexture: THREE.VideoTexture }) {
  useFrame(() => {
    if (videoTexture) {
      videoTexture.needsUpdate = true;
    }
  });
  return null;
}

//
// Komponen VideoChromaKey: menerapkan chroma key hanya pada detik 11–22
// Sekarang menggunakan plane geometry ukuran 400×400 sehingga video mengisi kanvas
//
function VideoChromaKey({
  videoTexture,
}: {
  videoTexture: THREE.VideoTexture;
}) {
  const shaderRef = useRef<any>(null);

  useFrame(() => {
    if (videoTexture && videoTexture.image && shaderRef.current) {
      // Update uniform videoTime dengan currentTime dari elemen video
      shaderRef.current.uniforms.videoTime.value =
        videoTexture.image.currentTime || 0;
      console.log("Video time: ", videoTexture.image.currentTime);
    }
  });

  return (
    <mesh position={[0, 0, 0.1]}>
      <planeGeometry args={[400, 400]} />
      <shaderMaterial
        ref={shaderRef}
        uniforms={{
          videoTexture: { value: videoTexture },
          keyColor: { value: new THREE.Color(0x00ff00) },
          similarity: { value: 0.4 },
          smoothness: { value: 0.1 },
          videoTime: { value: 0.0 },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D videoTexture;
          uniform vec3 keyColor;
          uniform float similarity;
          uniform float smoothness;
          uniform float videoTime;
          varying vec2 vUv;
          
          void main() {
            vec4 color = texture2D(videoTexture, vUv);
            // Hanya terapkan chroma key pada detik 11 sampai 22
            if (videoTime >= 11.0 && videoTime <= 22.0) {
              float diff = distance(color.rgb, keyColor);
              float alpha = smoothstep(similarity, similarity + smoothness, diff);
              gl_FragColor = vec4(color.rgb, alpha);
            } else {
              gl_FragColor = vec4(color.rgb, 1.0);
            }
          }
        `}
        transparent
      />
    </mesh>
  );
}

//
// Komponen BackgroundMesh: menampilkan canvas static (hasil upload dan manipulasi)
// Di video preview, yang ditampilkan hanya gambar dasar (tanpa twibbon overlay)
// Transformasi (geser, scale, rotasi) diterapkan berdasarkan imageDimensions
//
function BackgroundMesh({
  imageTexture,
  twibbonTexture,
  pos,
  scale,
  rotation,
  imageWidth,
  imageHeight,
}: {
  imageTexture: THREE.Texture;
  twibbonTexture: THREE.Texture | null;
  pos: { x: number; y: number };
  scale: number;
  rotation: number;
  imageWidth: number;
  imageHeight: number;
}) {
  const radians = (-rotation * Math.PI) / 180;
  return (
    <group
      // Terapkan posisi, rotasi, dan skala yang sama seperti canvas image
      position={[pos.x, pos.y, -0.1]}
      rotation={[0, 0, radians]}
      scale={[scale, scale, 1]}
    >
      <mesh>
        {/* Gunakan dimensi asli gambar */}
        <planeGeometry args={[imageWidth, imageHeight]} />
        <meshBasicMaterial map={imageTexture} transparent />
      </mesh>
      {twibbonTexture && (
        <mesh>
          <planeGeometry args={[400, 400]} />
          <meshBasicMaterial map={twibbonTexture} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

//
// Komponen utama Canvas: termasuk preview upload, manipulasi, dan preview video (R3F)
//
export default function Canvas() {
  // Refs & state untuk upload/manipulasi gambar
  const btnUploadRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollToRef = useScrollToRef();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [initialPinchDistance, setInitialPinchDistance] = useState<
    number | null
  >(null);
  const [initialScale, setInitialScale] = useState(1);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  // Simpan dimensi asli gambar
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [twibbonImg, setTwibbonImg] = useState<HTMLImageElement | null>(null);
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  const [twibbonTexture, setTwibbonTexture] = useState<THREE.Texture | null>(
    null
  );
  const [dragging, setDragging] = useState(false);
  // Posisi offset (dalam pixel; 0 berarti pusat)
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scaleVal, setScaleVal] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isTwibbonActive, setIsTwibbonActive] = useState(false);

  // State untuk preview video dan video texture
  const btnPreviewRef = useRef<HTMLButtonElement | null>(null);
  const [showPreviewVideo, setShowPreviewVideo] = useState(false);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(
    null
  );
  // Simpan referensi elemen video untuk kontrol (play, dst)
  const videoElemRef = useRef<HTMLVideoElement | null>(null);
  // Untuk mendapatkan akses ke elemen canvas yang dibuat oleh R3F
  const r3fCanvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const [downloaded, setDownload] = useState(false);

  const canvasSize = 400; // Ukuran canvas statis (400×400)

  // Persiapan canvas statis: load twibbon dan gambar awal
  useEffect(() => {
    const twibbon = new Image();
    twibbon.src = "/twibbon.png";
    twibbon.onload = () => {
      setTwibbonImg(twibbon);
      // Buat texture untuk twibbon
      const tex = new THREE.Texture(twibbon);
      tex.needsUpdate = true;
      setTwibbonTexture(tex);
    };
    drawInitialCanvas();
  }, []);

  useEffect(() => {
    if (imageObj) drawCanvas();
  }, [imageObj, pos, scaleVal, rotation, twibbonImg]);

  // Buat video texture dari "/twibbon.mp4" saat preview video diaktifkan
  useEffect(() => {
    if (showPreviewVideo && !videoTexture) {
      const videoElem = document.createElement("video");
      videoElemRef.current = videoElem;
      videoElem.src = "/twibbon.mp4";
      videoElem.crossOrigin = "anonymous";
      videoElem.muted = false;
      videoElem.playsInline = true;
      videoElem.loop = false;

      const texture = new THREE.VideoTexture(videoElem);
      texture.flipY = true; // Pastikan orientasi benar
      texture.generateMipmaps = false; // Optimal untuk video
      setVideoTexture(texture);
      scrollToRef(btnPreviewRef, -50);
    }
  }, [showPreviewVideo, videoTexture]);

  // Gambar canvas awal
  const drawInitialCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "#333";
    ctx.font = "15px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Twibbon akan muncul disini...",
      canvasSize / 2,
      canvasSize / 2
    );
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !twibbonImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    if (imageObj) {
      ctx.save();
      // Translate ke pusat (200,200) lalu geser sesuai pos
      ctx.translate(pos.x + canvasSize / 2, pos.y + canvasSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scaleVal, scaleVal);
      ctx.globalAlpha = 1.0;
      ctx.drawImage(
        imageObj,
        -imageObj.width / 2,
        -imageObj.height / 2,
        imageObj.width,
        imageObj.height
      );
      ctx.restore();
    }
    // Pada canvas statis, overlay twibbon masih diinginkan
    if (isTwibbonActive && twibbonImg) {
      ctx.globalAlpha = 0.7;
      ctx.drawImage(twibbonImg, 0, 0, canvasSize, canvasSize);
    }
    ctx.globalAlpha = 1.0;
  };

  // Fungsi upload image
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Hanya file JPG/JPEG/PNG yang diperbolehkan.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        scrollToRef(canvasRef, -50);
        if (!canvas) return;
        const { width, height } = img;
        const maxDim = Math.max(width, height);
        const fitScale = canvasSize / maxDim; // Hitung scale agar gambar pas di canvas
        setImageObj(img);
        setImageDimensions({ width, height }); // Simpan dimensi asli gambar untuk R3F

        // Buat texture dari gambar yang diupload
        const tex = new THREE.Texture(img);
        tex.flipY = true; // Hindari pembalikan vertikal
        tex.minFilter = THREE.LinearFilter; // Tingkatkan kualitas tampilan gambar
        tex.generateMipmaps = true; // Aktifkan mipmaps untuk optimasi
        tex.needsUpdate = true; // Pastikan perubahan diterapkan

        setImageTexture(tex);
        setIsTwibbonActive(true);
        setRotation(0); // Reset rotasi
        setPos({ x: 0, y: 0 }); // Pusatkan gambar
        setScaleVal(fitScale); // Sesuaikan scale gambar dengan ukuran kanvas
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Fungsi drag untuk canvas statis
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageObj) return;
    setDragging(true);
    setOffset({
      x: e.nativeEvent.offsetX - pos.x - canvasSize / 2,
      y: e.nativeEvent.offsetY - pos.y - canvasSize / 2,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: e.nativeEvent.offsetX - canvasSize / 2 - offset.x,
      y: e.nativeEvent.offsetY - canvasSize / 2 - offset.y,
    });
  };

  const getDistance = (
    t1: React.Touch | Touch,
    t2: React.Touch | Touch
  ): number => {
    return Math.hypot(
      (t2 as Touch).clientX - (t1 as Touch).clientX,
      (t2 as Touch).clientY - (t1 as Touch).clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(dist);
      setInitialScale(scaleVal);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDragging(true);
      setOffset({
        x: touch.clientX - rect.left - pos.x - canvasSize / 2,
        y: touch.clientY - rect.top - pos.y - canvasSize / 2,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault();
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const scaleFactor = newDist / initialPinchDistance;
      const newScale = Math.max(0.1, Math.min(2, initialScale * scaleFactor));
      setScaleVal(newScale);
    } else if (dragging && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        x: touch.clientX - rect.left - canvasSize / 2 - offset.x,
        y: touch.clientY - rect.top - canvasSize / 2 - offset.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    setInitialPinchDistance(null);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Reset semua state dan canvas
  const handleReset = () => {
    setImageObj(null);
    setScaleVal(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
    setIsTwibbonActive(false);
    drawInitialCanvas();
    setFileInputKey((prevKey) => prevKey + 1);
    scrollToRef(canvasRef, -50);
    setShowPreviewVideo(false);
    setVideoTexture(null);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  // Aktifkan preview video
  const handlePreview = () => {
    setShowPreviewVideo(true);
  };

  // Fungsi play video: memanggil metode play pada elemen video
  const handlePlayVideo = () => {
    if (videoElemRef.current) {
      videoElemRef.current.play().then(() => {
        setPlaying(true);
      });
    }
  };

  const handlePauseVideo = () => {
    if (videoElemRef.current) {
      videoElemRef.current.pause();
      setPlaying(false);
    }
  };

  // Fungsi untuk download video dari canvas R3F dengan audio, full durasi, & kualitas HD.
  const handleDownload = () => {
    if (!r3fCanvasRef.current) {
      console.error("Canvas react‑three‑fiber tidak ditemukan");
      return;
    }

    // Ensure video starts from the beginning and plays
    if (videoElemRef.current) {
      videoElemRef.current.currentTime = 0;
      videoElemRef.current.play().catch((err) => {
        console.error("Gagal memulai video:", err);
      });
    }

    const canvasElem = r3fCanvasRef.current;
    const canvasStream = canvasElem.captureStream(30); // Capture stream from canvas
    const videoStream = (
      videoElemRef.current as HTMLVideoElement & {
        captureStream?: () => MediaStream;
      }
    )?.captureStream?.();

    if (videoStream) {
      const audioTracks = videoStream.getAudioTracks();
      audioTracks.forEach((track: MediaStreamTrack) => {
        canvasStream.addTrack(track); // Add audio tracks to canvas stream
      });
    }

    const recorder = new MediaRecorder(canvasStream, {
      mimeType: "video/webm; codecs=vp8",
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "twibbon-video.webm";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    recorder.start();

    if (videoElemRef.current) {
      videoElemRef.current.onended = () => {
        if (recorder.state === "recording") recorder.stop();
      };
    }
  };

  return (
    <>
      {/* Canvas statis untuk upload & manipulasi (resize, geser, rotate) */}
      <canvas
        id="imgCanvas"
        ref={canvasRef}
        className={`${
          imageObj ? "cursor-move" : "cursor-default"
        } border mb-3 mx-auto`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {imageObj && (
        <div className="canvas-controls flex flex-col mb-4">
          <span className="canvas-info mx-auto text-center">
            Drag/Pinch-Zoom untuk geser/ubah ukuran gambar, atau gunakan slider
            di bawah:
          </span>
          <label className="block mb-2">
            Resize:
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.01"
              value={scaleVal}
              onChange={(e) => setScaleVal(parseFloat(e.target.value))}
              className="w-full"
            />
          </label>
          <label className="block mb-2">
            Geser Horizontal (X):
            <input
              type="range"
              min={-canvasSize / 2}
              max={canvasSize / 2}
              step="1"
              value={pos.x}
              onChange={(e) => setPos({ ...pos, x: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <label className="block mb-2">
            Geser Vertikal (Y):
            <input
              type="range"
              min={-canvasSize / 2}
              max={canvasSize / 2}
              step="1"
              value={pos.y}
              onChange={(e) => setPos({ ...pos, y: Number(e.target.value) })}
              className="w-full"
            />
          </label>
          <div className="flex justify-between gap-2 mt-3">
            <button
              onClick={handleRotateRight}
              className="btn-rotate inline-flex items-center justify-center gap-2"
            >
              Rotate
              <Icon icon="fa:rotate-right" />
            </button>
            <button onClick={handleReset} className="btn-reset">
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="twibbon-buttons mb-3 flex justify-center gap-3 flex-wrap">
        <input
          key={fileInputKey}
          type="file"
          accept="image/jpeg,image/png"
          ref={fileInputRef}
          className="hidden"
          onChange={handleUpload}
        />
        {!imageObj && (
          <button
            ref={btnUploadRef}
            className="btn-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon icon="ep:upload-filled" />
            <span className="ms-1">Upload</span>
          </button>
        )}
        {imageObj && (
          <button
            ref={btnPreviewRef}
            onClick={handlePreview}
            className="btn-preview bg-blue-500 text-white px-3 py-1 rounded"
          >
            <Icon icon="mingcute:video-line" />
            <span className="ms-1">Preview</span>
          </button>
        )}
      </div>

      {/* Preview video menggunakan React Three Fiber */}
      {showPreviewVideo && (
        <div className="twibbon-video">
          <R3FCanvas
            // Menggunakan kamera ortografi agar ruang koordinat 400×400 dengan pusat di (0,0)
            orthographic
            camera={{
              left: -200,
              right: 200,
              top: 200,
              bottom: -200,
              near: -1000,
              far: 1000,
              position: [0, 0, 1],
            }}
            // Setel dpr agar renderer menghasilkan output dengan resolusi tinggi sesuai device
            dpr={window.devicePixelRatio}
            onCreated={({ gl }) => {
              r3fCanvasRef.current = gl.domElement;
            }}
            // style={{ width: "400px", height: "400px" }}
          >
            {/* Background Mesh: menampilkan gambar dasar dengan transformasi yang sama seperti pada canvas statis */}
            {imageTexture && imageDimensions && (
              <BackgroundMesh
                imageTexture={imageTexture}
                twibbonTexture={null}
                pos={{ x: pos.x, y: -pos.y }} // Invert Y coordinate
                scale={scaleVal}
                rotation={rotation} // Reverse the rotation direction
                imageWidth={imageDimensions.width}
                imageHeight={imageDimensions.height}
              />
            )}
            {/* Video overlay dengan efek chroma key pada detik 11-22 */}
            {videoTexture && <VideoChromaKey videoTexture={videoTexture} />}
            {/* Pastikan videoTexture diperbarui tiap frame */}
            {videoTexture && <UpdateTexture videoTexture={videoTexture} />}
          </R3FCanvas>

          <div className="twibbon-video-buttons flex flex-wrap gap-2 justify-center">
            <button
              onClick={playing ? handlePauseVideo : handlePlayVideo}
              className={playing ? "btn-pause" : "btn-play"}
            >
              <Icon
                icon={playing ? "line-md:pause" : "mingcute:play-fill"}
                className="h-5"
              />
              <span className="ms-1">{playing ? "Pause" : "Play"}</span>
            </button>
            <button onClick={handleDownload} className="btn-download">
              <Icon icon="tabler:download" className="h-5" />
              <span className="ms-1">Download</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
