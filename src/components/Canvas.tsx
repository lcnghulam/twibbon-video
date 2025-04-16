"use client";

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useScrollToRef } from "@/hooks/scrollToRef";
import { dechroma } from "dechroma";

export default function Canvas() {
  //
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
  const [twibbonImg, setTwibbonImg] = useState<HTMLImageElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isTwibbonActive, setIsTwibbonActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasVideoRef = useRef<HTMLCanvasElement>(null);
  const [showPreviewVideo, setShowPreviewVideo] = useState(false);

  useEffect(() => {
    const twibbon = new Image();
    twibbon.src = "/twibbon.png";
    twibbon.onload = () => setTwibbonImg(twibbon);
    drawInitialCanvas();
  }, []);

  useEffect(() => {
    if (imageObj) drawCanvas();
  }, [imageObj, pos, scale, rotation]);

  const canvasSize = 400;

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
      ctx.translate(pos.x + canvasSize / 2, pos.y + canvasSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);
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

    if (isTwibbonActive) {
      ctx.globalAlpha = 0.7;
      ctx.drawImage(twibbonImg, 0, 0, canvasSize, canvasSize);
    }

    ctx.globalAlpha = 1.0;
  };

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
        scrollToRef(canvasRef, -50); // offset -50px
        if (!canvas) return;

        const { width, height } = img;
        const maxDim = Math.max(width, height);
        const fitScale = canvasSize / maxDim;

        setImageObj(img);
        setIsTwibbonActive(true);
        setRotation(0);
        setPos({ x: 0, y: 0 });
        setScale(fitScale);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    const touch1 = t1 as Touch;
    const touch2 = t2 as Touch;
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(dist);
      setInitialScale(scale);
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
      const newScale = Math.max(0.1, Math.min(2, initialScale * scaleFactor)); // clamp
      setScale(newScale);
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

  const handlePreview = async () => {
    if (showPreviewVideo) {
      scrollToRef(videoRef, -50);
    } else {
      setShowPreviewVideo(true);
    }
  };

  useEffect(() => {
    if (!showPreviewVideo) return;

    const canvas = canvasVideoRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    const canvasSize = 400;

    if (!canvas || !video || !ctx || !imageObj) {
      console.log("❌ Missing elements");
      return;
    }

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const chromaStart = 11; // chroma key start's time
    const chromaEnd = 21; // chroma key end's time
    let animationFrameId: number;

    // BG Image Render
    const drawTransformedImage = () => {
      if (!imageObj) {
        console.error("❌ Image object null!!!");
        return;
      }

      ctx.globalCompositeOperation = "source-over"; // Gambar background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pos.x + canvasSize / 2, pos.y + canvasSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      const scaledWidth = imageObj.width * scale;
      const scaledHeight = imageObj.height * scale;
      ctx.drawImage(
        imageObj,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );
      ctx.restore();
    };

    // Chroma Key Function
    const dechromaFix = (
      imageData: ImageData,
      rRange: [number, number],
      gRange: [number, number],
      bRange: [number, number]
    ): ImageData => {
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (
          r >= rRange[0] &&
          r <= rRange[1] &&
          g >= gRange[0] &&
          g <= gRange[1] &&
          b >= bRange[0] &&
          b <= bRange[1]
        ) {
          data[i + 3] = 0; // Transparent Pixel
        }
      }
      return imageData;
    };

    // Loop rendering
    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // BG Image starts to render
      drawTransformedImage();

      // Render twibbon video above Image
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply Chroma Key
      if (video.currentTime >= chromaStart && video.currentTime <= chromaEnd) {
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const processed = dechromaFix(frame, [10, 50], [200, 255], [0, 50]); // Sesuaikan rentang hijau jika perlu
        ctx.putImageData(processed, 0, 0);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    // Start Renderring
    const waitForFirstFrame = () => {
      if (video.readyState >= 2) {
        video.play();
        renderLoop();
      } else {
        video.addEventListener("loadeddata", () => {
          video.play();
          renderLoop();
        });
      }
    };

    waitForFirstFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.pause();
    };
  }, [showPreviewVideo, imageObj, pos, scale, rotation]);

  useEffect(() => {
    if (showPreviewVideo) {
      scrollToRef(videoRef, -50);
    }
  }, [showPreviewVideo]);

  const handleDownload = () => {
    const originalCanvas = canvasRef.current;
    if (!originalCanvas || !twibbonImg || !imageObj) return;

    const exportCanvas = document.createElement("canvas");
    const exportSize = {
      width: twibbonImg.width,
      height: twibbonImg.height,
    };

    exportCanvas.width = exportSize.width;
    exportCanvas.height = exportSize.height;

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const scaleRatioX = twibbonImg.width / canvasSize;
    const scaleRatioY = twibbonImg.height / canvasSize;

    const scaledX = (pos.x + canvasSize / 2) * scaleRatioX;
    const scaledY = (pos.y + canvasSize / 2) * scaleRatioY;

    const scaledImageWidth = imageObj.width * scale * scaleRatioX;
    const scaledImageHeight = imageObj.height * scale * scaleRatioY;

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, exportSize.width, exportSize.height);

    // Draw user image
    ctx.save();
    ctx.translate(scaledX, scaledY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      imageObj,
      -scaledImageWidth / 2,
      -scaledImageHeight / 2,
      scaledImageWidth,
      scaledImageHeight
    );
    ctx.restore();

    // Draw Twibbon
    ctx.drawImage(twibbonImg, 0, 0, exportSize.width, exportSize.height);

    // Download
    const link = document.createElement("a");
    link.download = "twibbon-polkesma-2025.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  const handleReset = () => {
    setImageObj(null);
    setScale(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
    setIsTwibbonActive(false);
    drawInitialCanvas();
    setFileInputKey((prevKey) => prevKey + 1);
    scrollToRef(canvasRef, -50); // offset -50px
    setShowPreviewVideo(false);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  return (
    <>
      <canvas
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
            Drag/Pinch-Zoom melalui canvas untuk geser/ubah ukuran gambar atau
            menggunakan bar-slider tool dibawah ini:
          </span>
          <label className="block mb-2">
            Resize:
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
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
          <>
            <button
              ref={btnUploadRef}
              className="btn-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon icon="ep:upload-filled" />
              <span className="ms-1">Upload</span>
            </button>
          </>
        )}

        {imageObj && (
          <>
            <button
              onClick={handlePreview}
              className="btn-preview bg-blue-500 text-white px-3 py-1 rounded"
            >
              <Icon icon="mingcute:video-line" />
              <span className="ms-1">Preview</span>
            </button>
          </>
        )}
      </div>

      {showPreviewVideo && (
        <>
          <div className="twibbon-video mb-3">
            <video
              ref={videoRef}
              src="/twibbon.mp4"
              controls
              width={400}
              height={100}
            />
            <canvas ref={canvasVideoRef} width={400} />
            <button
              onClick={handleDownload}
              className="btn-download bg-green-500 text-white px-3 py-1 rounded"
            >
              <Icon icon="tabler:download" className="h-5" />
              <span className="ms-1">Download</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
