import React, { useState, useRef, useEffect } from 'react';
import { StudentProfile, GameProgress } from '../types';
import { storageService } from '../services/storage';
import { audioService } from '../services/audio';
import { ART_MATERIAL_IMAGES } from '../data/constants';
import confetti from 'canvas-confetti';
import {
  Palette,
  Scissors,
  Sparkles,
  Layers,
  RotateCcw,
  Trash2,
  Download,
  Send,
  Video,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  Sliders,
  CheckCircle2,
  PenTool,
  Upload,
  Wand2,
  Eraser,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import {
  PRESET_CREATIVE_STICKERS,
  generateAiStickerSvg,
  drawStickerWithWhiteOutline,
  StickerItem,
} from '../utils/stickerGenerator';

interface DrawStudioProps {
  student: StudentProfile | null;
  progress: GameProgress;
  onUpdateProgress: (updated: GameProgress) => void;
  onBackToRoadmap?: () => void;
  onOpenCeremonyModal?: () => void;
}

export interface CanvasElement {
  id: string;
  type: 'paper' | 'sticker';
  color?: string;
  shape?: 'square' | 'circle' | 'triangle' | 'heart' | 'star' | 'strip';
  stickerKey?: string;
  stickerImage?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isGlued: boolean;
  cutStyle?: 'normal' | 'wavy' | 'zigzag' | 'half';
}

const PAPER_COLORS = [
  { name: '活力红', hex: '#EF4444' },
  { name: '阳光黄', hex: '#FBBF24' },
  { name: '天空蓝', hex: '#38BDF8' },
  { name: '草地绿', hex: '#4ADE80' },
  { name: '蜜桃橙', hex: '#FB923C' },
  { name: '薰衣草', hex: '#C084FC' },
  { name: '棉花粉', hex: '#F472B6' },
  { name: '巧克力', hex: '#A16207' },
];

const PAPER_SHAPES: Array<{ id: CanvasElement['shape']; label: string }> = [
  { id: 'square', label: '正方形' },
  { id: 'circle', label: '圆形' },
  { id: 'triangle', label: '三角形' },
  { id: 'heart', label: '爱心' },
  { id: 'star', label: '小星星' },
  { id: 'strip', label: '长彩带' },
];

const QUICK_AI_PROMPTS = [
  '小猫咪',
  '彩虹云',
  '小恐龙',
  '纸飞机',
  '太空火箭',
  '小兔子',
  '甜筒冰淇淋',
  '太阳花',
  '小汽车',
  '四叶草',
  '甜甜圈',
];

const BRUSH_COLORS = [
  '#EF4444',
  '#F97316',
  '#FBBF24',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#1E293B',
];

export const DrawStudio: React.FC<DrawStudioProps> = ({
  student,
  progress,
  onUpdateProgress,
  onBackToRoadmap,
  onOpenCeremonyModal,
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'paper' | 'scissors' | 'stickers' | 'glue'>('stickers');

  // Sticker Sub-mode: 'ai' | 'draw' | 'upload' | 'preset'
  const [stickerMode, setStickerMode] = useState<'ai' | 'draw' | 'upload' | 'preset'>('ai');

  // Paper tool states
  const [selectedColor, setSelectedColor] = useState<string>('#FBBF24');
  const [selectedShape, setSelectedShape] = useState<CanvasElement['shape']>('square');

  // Sticker tool states
  const [customStickers, setCustomStickers] = useState<StickerItem[]>([]);
  const [aiKeyword, setAiKeyword] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Brush drawing states for custom sticker canvas
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushColor, setBrushColor] = useState<string>('#EF4444');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawnSomething, setHasDrawnSomething] = useState<boolean>(false);

  // Upload file ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Main Canvas states
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [artworkName, setArtworkName] = useState<string>('我的创艺拼贴画');
  const [gluedNotice, setGluedNotice] = useState<string | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<{
    show: boolean;
    title: string;
    msg: string;
  }>({ show: false, title: '', msg: '' });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging and resizing state
  const dragRef = useRef<{
    isDragging: boolean;
    elementId: string;
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
  } | null>(null);

  const resizeRef = useRef<{
    isResizing: boolean;
    elementId: string;
    startDistance: number;
    startScale: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const settings = storageService.getSettings();
  const getEmbedUrl = (url: string) => {
    let videoId = 'zb6YamXD8eU';
    const match = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      videoId = match[1];
    }
    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  };

  const pushHistory = (newElems: CanvasElement[]) => {
    setHistory((prev) => [...prev.slice(-15), elements]);
    setElements(newElems);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setElements(last);
    setSelectedId(null);
  };

  const handleClear = () => {
    if (elements.length === 0) return;
    pushHistory([]);
    setSelectedId(null);
  };

  // Add Paper Element to Canvas
  const handleAddPaper = () => {
    audioService.playStampSound();
    const newEl: CanvasElement = {
      id: 'paper_' + Date.now() + '_' + Math.floor(Math.random() * 100),
      type: 'paper',
      color: selectedColor,
      shape: selectedShape,
      x: 200 + (Math.random() * 60 - 30),
      y: 180 + (Math.random() * 60 - 30),
      scale: 1,
      rotation: Math.floor(Math.random() * 16 - 8),
      isGlued: false,
      cutStyle: 'normal',
    };
    pushHistory([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  // Add Sticker Element to Canvas with iconic white outline
  const handleAddSticker = (stickerUrl: string, label: string = '贴纸') => {
    audioService.playStampSound();
    const newEl: CanvasElement = {
      id: 'sticker_' + Date.now() + '_' + Math.floor(Math.random() * 100),
      type: 'sticker',
      stickerKey: label,
      stickerImage: stickerUrl,
      x: 220 + (Math.random() * 60 - 30),
      y: 190 + (Math.random() * 60 - 30),
      scale: 1,
      rotation: Math.floor(Math.random() * 16 - 8),
      isGlued: false,
    };
    pushHistory([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  // =========================================================================
  // 1. MINI CANVAS BRUSH DRAWING FOR CUSTOM STICKERS
  // =========================================================================
  const getMiniCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDownMiniCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setHasDrawnSomething(true);

    const { x, y } = getMiniCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerMoveMiniCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getMiniCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUpMiniCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
  };

  const handleClearMiniCanvas = () => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSomething(false);
  };

  const handleSaveHandDrawnSticker = () => {
    const canvas = miniCanvasRef.current;
    if (!canvas || !hasDrawnSomething) return;

    const dataUrl = canvas.toDataURL('image/png');
    const newSticker: StickerItem = {
      id: `custom_draw_${Date.now()}`,
      label: '手绘贴纸',
      dataUrl,
      source: 'draw',
    };

    setCustomStickers((prev) => [newSticker, ...prev]);
    handleAddSticker(dataUrl, '手绘贴纸');
    handleClearMiniCanvas();
  };

  // =========================================================================
  // 2. UPLOAD IMAGE AS STICKER
  // =========================================================================
  const handleUploadStickerImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const src = loadEvt.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        // Optimize to standard sticker bounds
        const canvas = document.createElement('canvas');
        const maxDim = 180;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const optimizedDataUrl = canvas.toDataURL('image/png');
          const newSticker: StickerItem = {
            id: `upload_${Date.now()}`,
            label: file.name.slice(0, 4) || '上传贴纸',
            dataUrl: optimizedDataUrl,
            source: 'upload',
          };
          setCustomStickers((prev) => [newSticker, ...prev]);
          handleAddSticker(optimizedDataUrl, '自选贴纸');
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // =========================================================================
  // 3. AI STICKER SYNTHESIS FROM KEYWORD
  // =========================================================================
  const handleGenerateAiSticker = (targetKw?: string) => {
    const query = (targetKw || aiKeyword).trim();
    if (!query) return;

    setIsGeneratingAi(true);
    setTimeout(() => {
      const stickerDataUrl = generateAiStickerSvg(query);
      const newSticker: StickerItem = {
        id: `ai_${Date.now()}_${encodeURIComponent(query)}`,
        label: query,
        dataUrl: stickerDataUrl,
        source: 'ai',
      };
      setCustomStickers((prev) => [newSticker, ...prev]);
      handleAddSticker(stickerDataUrl, query);
      setIsGeneratingAi(false);
      setAiKeyword('');
    }, 450);
  };

  // Apply Scissors cut to selected paper
  const handleApplyCut = (style: CanvasElement['cutStyle']) => {
    if (!selectedId) return;
    audioService.playStampSound();
    const updated = elements.map((el) => {
      if (el.id === selectedId && el.type === 'paper' && !el.isGlued) {
        return { ...el, cutStyle: style };
      }
      return el;
    });
    pushHistory(updated);
  };

  // Toggle Glue Lock
  const handleToggleGlue = () => {
    if (!selectedId) return;
    audioService.playCelebrationChime();
    const updated = elements.map((el) => {
      if (el.id === selectedId) {
        return { ...el, isGlued: !el.isGlued };
      }
      return el;
    });
    pushHistory(updated);
  };

  // Direct scale adjustment
  const handleScaleSelected = (delta: number) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === selectedId && !el.isGlued) {
          const newScale = Math.max(0.4, Math.min(3.0, +(el.scale + delta).toFixed(2)));
          return { ...el, scale: newScale };
        }
        return el;
      })
    );
  };

  // Set absolute scale value
  const handleSetScaleSelected = (val: number) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === selectedId && !el.isGlued) {
          return { ...el, scale: Math.max(0.4, Math.min(3.0, val)) };
        }
        return el;
      })
    );
  };

  // Rotate selected element
  const handleRotateSelected = (delta: number) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === selectedId && !el.isGlued) {
          return { ...el, rotation: (el.rotation + delta) % 360 };
        }
        return el;
      })
    );
  };

  // Bring selected element to front
  const handleBringToFront = () => {
    if (!selectedId) return;
    const target = elements.find((e) => e.id === selectedId);
    if (!target) return;
    const others = elements.filter((e) => e.id !== selectedId);
    pushHistory([...others, target]);
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    pushHistory(elements.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  // =========================================================================
  // SMOOTH DRAG & DROP IMPLEMENTATION (Mouse + Touch via Pointer Events)
  // =========================================================================
  const handlePointerDownElement = (e: React.PointerEvent, el: CanvasElement) => {
    e.stopPropagation();

    if (el.isGlued) {
      setGluedNotice(`已涂胶水固定！点击“解开胶水”后可自由移动。`);
      setTimeout(() => setGluedNotice(null), 2500);
      setSelectedId(el.id);
      return;
    }

    setSelectedId(el.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      isDragging: true,
      elementId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: el.x,
      elemStartY: el.y,
    };
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent) => {
    // 1. Handle Element Move
    if (dragRef.current && dragRef.current.isDragging) {
      const { elementId, startX, startY, elemStartX, elemStartY } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const canvas = canvasRef.current;
      const maxW = canvas ? canvas.clientWidth - 40 : 600;
      const maxH = canvas ? canvas.clientHeight - 40 : 400;

      const nextX = Math.max(30, Math.min(maxW, elemStartX + dx));
      const nextY = Math.max(30, Math.min(maxH, elemStartY + dy));

      setElements((prev) =>
        prev.map((item) => (item.id === elementId ? { ...item, x: nextX, y: nextY } : item))
      );
      return;
    }

    // 2. Handle Corner Scale Drag
    if (resizeRef.current && resizeRef.current.isResizing) {
      const { elementId, startDistance, startScale, centerX, centerY } = resizeRef.current;
      const currentDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      const scaleMultiplier = currentDist / Math.max(20, startDistance);
      const newScale = Math.max(0.4, Math.min(3.0, +(startScale * scaleMultiplier).toFixed(2)));

      setElements((prev) =>
        prev.map((item) => (item.id === elementId ? { ...item, scale: newScale } : item))
      );
    }
  };

  const handlePointerUpCanvas = (e: React.PointerEvent) => {
    if (dragRef.current && dragRef.current.isDragging) {
      dragRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
    if (resizeRef.current && resizeRef.current.isResizing) {
      resizeRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  // Start Corner Resize Handle Drag
  const handlePointerDownCornerHandle = (e: React.PointerEvent, el: CanvasElement) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const elemClientCenterX = canvasRect.left + el.x;
    const elemClientCenterY = canvasRect.top + el.y;

    const startDist = Math.hypot(e.clientX - elemClientCenterX, e.clientY - elemClientCenterY);

    resizeRef.current = {
      isResizing: true,
      elementId: el.id,
      startDistance: startDist,
      startScale: el.scale,
      centerX: elemClientCenterX,
      centerY: elemClientCenterY,
    };
  };

  // Render SVG or shape on canvas
  const renderShapeSvg = (el: CanvasElement) => {
    const isWavy = el.cutStyle === 'wavy';
    const isZigzag = el.cutStyle === 'zigzag';
    const isHalf = el.cutStyle === 'half';

    if (el.shape === 'circle') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm pointer-events-none">
          <circle cx="50" cy="50" r={isHalf ? 35 : 45} fill={el.color} stroke="#374151" strokeWidth="2.5" />
        </svg>
      );
    }
    if (el.shape === 'triangle') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm pointer-events-none">
          <polygon points="50,15 90,85 10,85" fill={el.color} stroke="#374151" strokeWidth="2.5" />
        </svg>
      );
    }
    if (el.shape === 'heart') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm pointer-events-none">
          <path
            d="M50 82 C25 62 10 45 10 28 C10 16 20 8 32 8 C40 8 46 13 50 19 C54 13 60 8 68 8 C80 8 90 16 90 28 C90 45 75 62 50 82 Z"
            fill={el.color}
            stroke="#374151"
            strokeWidth="2.5"
          />
        </svg>
      );
    }
    if (el.shape === 'star') {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm pointer-events-none">
          <polygon
            points="50,10 62,38 92,40 68,60 76,88 50,72 24,88 32,60 8,40 38,38"
            fill={el.color}
            stroke="#374151"
            strokeWidth="2.5"
          />
        </svg>
      );
    }
    if (el.shape === 'strip') {
      return (
        <svg viewBox="0 0 140 50" className="w-full h-full drop-shadow-sm pointer-events-none">
          <rect
            x="5"
            y="5"
            width="130"
            height="40"
            rx={isWavy ? 15 : isZigzag ? 2 : 6}
            fill={el.color}
            stroke="#374151"
            strokeWidth="2.5"
            strokeDasharray={isZigzag ? '6 4' : 'none'}
          />
        </svg>
      );
    }
    // Default square
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm pointer-events-none">
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx={isWavy ? 24 : isZigzag ? 4 : 8}
          fill={el.color}
          stroke="#374151"
          strokeWidth="2.5"
          strokeDasharray={isZigzag ? '8 4' : 'none'}
        />
      </svg>
    );
  };

  // Download artwork image as PNG with white outline on stickers
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background paper
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 780, 580);

    // Title & author
    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(artworkName, 40, 50);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#92400E';
    ctx.fillText(`小小创作者：${student?.nickname || '声音小画师'}`, 40, 80);

    // Render elements
    let pendingImages = 0;
    const onRenderComplete = () => {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${artworkName || '创艺拼贴画'}.png`;
      a.click();
    };

    const stickersToDraw = elements.filter((e) => e.type === 'sticker' && e.stickerImage);
    pendingImages = stickersToDraw.length;

    // Draw Paper elements first
    elements.forEach((el) => {
      if (el.type === 'paper') {
        ctx.save();
        ctx.translate(el.x * 1.3, el.y * 1.3);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.scale(el.scale, el.scale);

        ctx.fillStyle = el.color || '#FBBF24';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (el.shape === 'circle') {
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
        } else if (el.shape === 'triangle') {
          ctx.moveTo(0, -36);
          ctx.lineTo(36, 36);
          ctx.lineTo(-36, 36);
          ctx.closePath();
        } else if (el.shape === 'strip') {
          ctx.roundRect(-55, -18, 110, 36, 8);
        } else {
          ctx.roundRect(-36, -36, 72, 72, 10);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    });

    if (pendingImages === 0) {
      onRenderComplete();
      return;
    }

    // Draw stickers with white halo outline
    stickersToDraw.forEach((el) => {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.translate(el.x * 1.3, el.y * 1.3);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.scale(el.scale, el.scale);

        const w = 70;
        const h = 70;
        const dx = -w / 2;
        const dy = -h / 2;

        // Contour die-cut white outline
        drawStickerWithWhiteOutline(ctx, img, dx, dy, w, h, 3.5);

        ctx.restore();

        pendingImages--;
        if (pendingImages === 0) {
          onRenderComplete();
        }
      };
      img.onerror = () => {
        pendingImages--;
        if (pendingImages === 0) onRenderComplete();
      };
      img.src = el.stickerImage!;
    });
  };

  // Submit Artwork
  const handleSubmitArtwork = () => {
    if (elements.length === 0) {
      setSubmitFeedback({
        show: true,
        title: '画布还是空的呢',
        msg: '先从左侧选择彩色纸或贴纸，放在画布上开始你的创作吧！',
      });
      return;
    }

    audioService.playCelebrationChime();
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    setSubmitFeedback({
      show: true,
      title: '送出成功！',
      msg: '你的拼贴画作品已送至艺术大展展厅！全班同学都能欣赏到你的创意啦！',
    });
  };

  const selectedEl = elements.find((el) => el.id === selectedId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>通关奖励 · 自由拼贴工坊</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#263D64]">创艺园地 · 自由创作</h1>
          <p className="text-xs sm:text-sm font-bold text-[#263D64]/70">
            用彩色纸、剪刀、贴纸和胶水四种工具，可自己画贴纸、AI生成或上传图片，拼出专属大作！
          </p>
        </div>

        {onBackToRoadmap && (
          <button
            onClick={onBackToRoadmap}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#263D64]/15 hover:bg-amber-50 text-xs font-bold text-[#263D64] transition-colors cursor-pointer"
          >
            回冒险图
          </button>
        )}
      </div>

      {/* Opening Ceremony & Certificate Celebration Banner (Moved here from Quest / Level 5) */}
      {onOpenCeremonyModal && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-white/60 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40">
              <Sparkles className="w-6 h-6 text-yellow-100 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                  通关专属殿堂
                </span>
                <span className="text-xs text-amber-100 font-bold">全关卡已通过！</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                开启艺术展开幕仪式与奖状
              </h2>
              <p className="text-xs text-amber-100/90 font-medium">
                点击开启大展剪彩仪式，大展灯光全部亮起，生成并下载你的专属荣誉奖状！
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCeremonyModal}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-[#263D64] font-black text-sm shadow-md hover:bg-amber-50 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-600 fill-current" />
            <span>开启艺术展开幕仪式与奖状 →</span>
          </button>
        </div>
      )}

      {/* Extended Learning Micro-lesson Collapsible Card */}
      <div className="storybook-card rounded-3xl bg-white p-5 border-2 border-amber-300 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setIsVideoOpen(!isVideoOpen)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#263D64]">
                拼贴画技法微课堂（点击展开 / 收起）
              </h2>
              <p className="text-xs text-[#263D64]/60 font-medium">
                先观察微课里的折纸和裁剪小技巧，也可以随时直接在下方画布开始创作！
              </p>
            </div>
          </div>
          {isVideoOpen ? (
            <ChevronUp className="w-5 h-5 text-amber-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-700" />
          )}
        </button>

        {isVideoOpen && (
          <div className="pt-3 border-t border-amber-200 space-y-3 animate-in fade-in duration-200">
            <div className="aspect-video w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-md border-2 border-[#263D64]/15 bg-black">
              <iframe
                src={getEmbedUrl(settings.youtubeVideoUrl)}
                title="拼贴画技法微课堂"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-amber-900 font-bold text-center">
              观看小锦囊：先用大张彩色纸铺好底色，再用剪刀剪出有趣的形状，最后用胶水固定并贴上小贴纸！
            </p>
          </div>
        )}
      </div>

      {/* Main Studio Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 4 Tools Palette */}
        <div className="lg:col-span-5 space-y-4">
          <div className="storybook-card rounded-3xl p-5 bg-white space-y-4">
            <h3 className="text-sm font-black text-[#263D64] flex items-center gap-2 pb-2 border-b border-[#263D64]/10">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>四种虚拟美术工具</span>
            </h3>

            {/* 4 Tool Select Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'stickers', name: '贴纸工坊', img: '/assets/images/badges/badge-star.svg' },
                { id: 'paper', name: '彩色纸', img: ART_MATERIAL_IMAGES.coloredPaper },
                { id: 'scissors', name: '剪刀', img: ART_MATERIAL_IMAGES.scissors },
                { id: 'glue', name: '胶水', img: ART_MATERIAL_IMAGES.glue },
              ].map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id as any)}
                  className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTool === tool.id
                      ? 'bg-amber-100 border-amber-500 shadow-sm ring-2 ring-amber-300'
                      : 'bg-white border-[#263D64]/15 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="w-7 h-7 flex items-center justify-center">
                    <img src={tool.img} alt={tool.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs font-black text-[#263D64]">{tool.name}</span>
                </button>
              ))}
            </div>

            {/* ========================================================================= */}
            {/* SUB-PANEL: CREATIVE STICKERS WORKSHOP (Draw, AI, Upload, Brand-new)       */}
            {/* ========================================================================= */}
            {activeTool === 'stickers' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#263D64]">自制与选选贴纸：</span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    放入画布自动生成白色白边
                  </span>
                </div>

                {/* 4 Creative Sticker Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStickerMode('ai')}
                    className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      stickerMode === 'ai'
                        ? 'bg-white text-purple-700 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>AI生成</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStickerMode('draw')}
                    className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      stickerMode === 'draw'
                        ? 'bg-white text-amber-700 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>画贴纸</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStickerMode('upload')}
                    className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      stickerMode === 'upload'
                        ? 'bg-white text-sky-700 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>传图片</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStickerMode('preset')}
                    className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      stickerMode === 'preset'
                        ? 'bg-white text-emerald-700 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>萌贴纸</span>
                  </button>
                </div>

                {/* 1. AI Sticker Generator Tab */}
                {stickerMode === 'ai' && (
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5 animate-in fade-in">
                    <div className="text-[11px] font-bold text-purple-950 flex items-center justify-between">
                      <span>输入想要什么，AI自动生成专属贴纸：</span>
                      <span className="text-[10px] text-purple-600">纯白防透边</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={aiKeyword}
                        onChange={(e) => setAiKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiSticker()}
                        placeholder="输入关键字，如：小恐龙、火箭、小猫咪..."
                        className="flex-1 px-3 py-1.5 rounded-xl border border-purple-300 text-xs font-bold text-[#263D64] bg-white focus:outline-purple-500"
                      />
                      <button
                        type="button"
                        disabled={!aiKeyword.trim() || isGeneratingAi}
                        onClick={() => handleGenerateAiSticker()}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>{isGeneratingAi ? '生成中...' : '生成'}</span>
                      </button>
                    </div>

                    {/* Quick Keyword Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {QUICK_AI_PROMPTS.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => handleGenerateAiSticker(kw)}
                          className="px-2 py-1 rounded-lg bg-white border border-purple-200 hover:border-purple-400 hover:bg-purple-100/60 text-[10px] font-bold text-purple-900 transition-colors cursor-pointer"
                        >
                          +{kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Hand-Drawn Custom Sticker Tab */}
                {stickerMode === 'draw' && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                      <span>用小画笔自由画一个专属贴纸：</span>
                      <button
                        type="button"
                        onClick={handleClearMiniCanvas}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        清空画板
                      </button>
                    </div>

                    {/* Mini Drawing Pad */}
                    <div className="relative w-full h-[140px] bg-white rounded-xl border-2 border-dashed border-amber-300 shadow-inner overflow-hidden touch-none flex items-center justify-center">
                      <canvas
                        ref={miniCanvasRef}
                        width={240}
                        height={140}
                        onPointerDown={handlePointerDownMiniCanvas}
                        onPointerMove={handlePointerMoveMiniCanvas}
                        onPointerUp={handlePointerUpMiniCanvas}
                        className="w-full h-full cursor-crosshair"
                      />
                      {!hasDrawnSomething && (
                        <div className="absolute pointer-events-none text-center text-amber-700/40 text-xs font-bold">
                          在此用手指或鼠标画画，画好点下方生成！
                        </div>
                      )}
                    </div>

                    {/* Brush Controls Bar */}
                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                      {/* Color Palette */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {BRUSH_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setBrushColor(c);
                              setIsEraser(false);
                            }}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                              brushColor === c && !isEraser ? 'scale-125 border-[#263D64] shadow-xs' : 'border-white'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Eraser Button */}
                      <button
                        type="button"
                        onClick={() => setIsEraser(!isEraser)}
                        className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                          isEraser
                            ? 'bg-amber-400 text-amber-950 border-amber-500'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <Eraser className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={!hasDrawnSomething}
                      onClick={handleSaveHandDrawnSticker}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>完成画贴纸，加入画布 (+带白色白边)</span>
                    </button>
                  </div>
                )}

                {/* 3. Upload Image as Sticker Tab */}
                {stickerMode === 'upload' && (
                  <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl text-center space-y-3 animate-in fade-in">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadStickerImage}
                      className="hidden"
                    />
                    <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl mx-auto flex items-center justify-center">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-sky-950">上传电脑或平板里的图片</div>
                      <div className="text-[10px] text-sky-800/70 mt-0.5">
                        支持将你画好的涂鸦或喜爱的照片上传，自动生成带白边的精美贴纸！
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>选择本地图片上传为贴纸</span>
                    </button>
                  </div>
                )}

                {/* 4. Brand-New Original Creative Stickers Grid */}
                {stickerMode === 'preset' && (
                  <div className="space-y-1.5 animate-in fade-in">
                    <div className="text-[11px] font-bold text-emerald-950 flex items-center justify-between">
                      <span>12款原创萌趣贴纸（绝不重复）：</span>
                      <span className="text-[10px] text-emerald-700">点击直接盖印</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESET_CREATIVE_STICKERS.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleAddSticker(st.dataUrl, st.label)}
                          className="p-1.5 bg-white hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-300 rounded-xl flex flex-col items-center justify-center gap-1 h-16 transition-all cursor-pointer active:scale-95 shadow-2xs group"
                        >
                          <img
                            src={st.dataUrl}
                            alt={st.label}
                            className="w-8 h-8 object-contain transition-transform group-hover:scale-115"
                            style={{
                              filter: 'drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)',
                            }}
                          />
                          <span className="text-[9px] font-bold text-slate-700 truncate max-w-full">
                            {st.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recently Created Custom Stickers Shelf */}
                {customStickers.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-[#263D64] flex items-center justify-between">
                      <span>我的专属贴纸架（点击再次使用）：</span>
                      <span className="text-[10px] text-amber-700">{customStickers.length} 枚</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {customStickers.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleAddSticker(st.dataUrl, st.label)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl flex flex-col items-center justify-center gap-1 w-14 h-16 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <img
                            src={st.dataUrl}
                            alt={st.label}
                            className="w-8 h-8 object-contain"
                            style={{
                              filter: 'drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)',
                            }}
                          />
                          <span className="text-[8px] font-bold text-amber-950 truncate max-w-full">
                            {st.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-panel 2: 彩色纸选择 */}
            {activeTool === 'paper' && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-[#263D64]">选择纸张颜色：</div>
                <div className="flex flex-wrap gap-2">
                  {PAPER_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setSelectedColor(col.hex)}
                      title={col.name}
                      style={{ backgroundColor: col.hex }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        selectedColor === col.hex ? 'scale-125 border-[#263D64] shadow-xs' : 'border-white'
                      }`}
                    />
                  ))}
                </div>

                <div className="text-xs font-bold text-[#263D64] pt-2">选择初始形状：</div>
                <div className="grid grid-cols-3 gap-2">
                  {PAPER_SHAPES.map((sh) => (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => setSelectedShape(sh.id)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                        selectedShape === sh.id
                          ? 'bg-[#263D64] text-white border-[#263D64]'
                          : 'bg-slate-50 text-[#263D64] border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sh.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddPaper}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition-all cursor-pointer mt-2"
                >
                  + 将彩色纸放入画布
                </button>
              </div>
            )}

            {/* Sub-panel 3: 剪刀工具 */}
            {activeTool === 'scissors' && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-[#263D64]">
                  {selectedEl && selectedEl.type === 'paper'
                    ? '已选中彩纸，点击剪裁边缘：'
                    : '请先在画布上点选一张彩纸，再使用剪刀改变它的边缘！'}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'wavy', label: '剪圆弧波浪' },
                    { id: 'zigzag', label: '剪锯齿花边' },
                    { id: 'half', label: '对半剪开' },
                    { id: 'normal', label: '还原平直边' },
                  ].map((cut) => (
                    <button
                      key={cut.id}
                      type="button"
                      disabled={!selectedEl || selectedEl.type !== 'paper' || selectedEl.isGlued}
                      onClick={() => handleApplyCut(cut.id as any)}
                      className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[#263D64] text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {cut.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-panel 4: 胶水工具 */}
            {activeTool === 'glue' && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-[#263D64]">胶水粘合固定功能：</div>
                <p className="text-xs text-[#263D64]/70 leading-relaxed">
                  点选画布上的任意素材后，点击下方按钮完成胶水粘合。固定后的素材不会因为误触而移动！
                </p>
                <button
                  type="button"
                  disabled={!selectedId}
                  onClick={handleToggleGlue}
                  className={`w-full py-2.5 rounded-xl font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedEl?.isGlued
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {selectedEl?.isGlued ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>揭开胶水（允许重新拖动与调整）</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>使用胶水粘合固定（防止误触）</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Digital Interactive Canvas Area */}
        <div className="lg:col-span-7 space-y-4">
          <div className="storybook-card rounded-3xl p-5 bg-white space-y-3">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#263D64]/10">
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <input
                  type="text"
                  value={artworkName}
                  onChange={(e) => setArtworkName(e.target.value)}
                  placeholder="作品名称"
                  className="px-3 py-1.5 rounded-xl border border-amber-300 text-xs font-black text-[#263D64] w-full"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  title="撤销上一步"
                  disabled={history.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#263D64] text-xs font-bold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>撤销</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  title="清空画布"
                  disabled={elements.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空</span>
                </button>
              </div>
            </div>

            {/* Selected Element Quick Size & Action Controls Bar */}
            {selectedEl ? (
              <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-300 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-950 flex items-center gap-1">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span>调节素材大小与方向</span>
                  </span>
                  {selectedEl.isGlued && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>胶水固定中</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Size Adjustment Controls */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-amber-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-[#263D64]">大小：</span>
                    <button
                      type="button"
                      disabled={selectedEl.isGlued}
                      onClick={() => handleScaleSelected(-0.15)}
                      title="缩小"
                      className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-30 cursor-pointer active:scale-90"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="0.4"
                      max="2.5"
                      step="0.05"
                      value={selectedEl.scale}
                      disabled={selectedEl.isGlued}
                      onChange={(e) => handleSetScaleSelected(parseFloat(e.target.value))}
                      className="w-20 accent-amber-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      disabled={selectedEl.isGlued}
                      onClick={() => handleScaleSelected(0.15)}
                      title="放大"
                      className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-30 cursor-pointer active:scale-90"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-amber-800 w-8 text-center">
                      {Math.round(selectedEl.scale * 100)}%
                    </span>
                  </div>

                  {/* Rotate Button */}
                  <button
                    type="button"
                    disabled={selectedEl.isGlued}
                    onClick={() => handleRotateSelected(15)}
                    title="顺时针旋转 15度"
                    className="p-1.5 px-2.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1 hover:bg-amber-100 disabled:opacity-30 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>旋转</span>
                  </button>

                  {/* Layer Control */}
                  <button
                    type="button"
                    onClick={handleBringToFront}
                    title="置于顶层"
                    className="p-1.5 px-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-[11px] font-bold hover:bg-amber-100 cursor-pointer"
                  >
                    置顶
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    title="删除此素材"
                    className="p-1.5 px-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs font-medium text-[#263D64]/60 flex items-center justify-center gap-2">
                <Move className="w-4 h-4 text-amber-500" />
                <span>点选画布中的任意彩纸或贴纸，即可直接拖动位置并随意缩放旋转！</span>
              </div>
            )}

            {/* Glued notice toast */}
            {gluedNotice && (
              <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-bold text-center animate-bounce">
                {gluedNotice}
              </div>
            )}

            {/* The Interactive Canvas Area */}
            <div
              ref={canvasRef}
              onClick={() => setSelectedId(null)}
              onPointerMove={handlePointerMoveCanvas}
              onPointerUp={handlePointerUpCanvas}
              className="relative w-full h-[400px] sm:h-[460px] bg-[#FFFDF9] rounded-2xl border-3 border-amber-300 shadow-inner overflow-hidden select-none touch-none"
            >
              {/* Background guide texture */}
              <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-around text-8xl text-amber-950 font-black">
                <span>ART</span>
              </div>

              {elements.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none text-[#263D64]/40">
                  <Palette className="w-12 h-12 stroke-1 mb-2 text-amber-400" />
                  <p className="text-sm font-bold">画布空空的，快从左侧添加彩色纸或贴纸吧！</p>
                  <p className="text-xs text-[#263D64]/40 mt-1">
                    贴纸带有精致白边，可自由手绘、AI生成或上传图片！
                  </p>
                </div>
              )}

              {/* Render placed elements */}
              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                const baseWidth = el.shape === 'strip' ? 120 : 80;
                const baseHeight = el.shape === 'strip' ? 45 : 80;

                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDownElement(e, el)}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`,
                      width: `${baseWidth}px`,
                      height: `${baseHeight}px`,
                      touchAction: 'none',
                    }}
                    className={`transition-shadow cursor-grab active:cursor-grabbing ${
                      isSelected
                        ? 'ring-3 ring-amber-500 ring-offset-2 z-30 shadow-xl'
                        : 'z-10 hover:ring-2 hover:ring-amber-300'
                    }`}
                  >
                    {/* Element Graphic: Paper */}
                    {el.type === 'paper' && renderShapeSvg(el)}

                    {/* Element Graphic: Sticker with iconic White Outline Effect */}
                    {el.type === 'sticker' && el.stickerImage && (
                      <div
                        className="w-full h-full flex items-center justify-center pointer-events-none select-none"
                        style={{
                          filter:
                            'drop-shadow(2px 0 0 #ffffff) drop-shadow(-2px 0 0 #ffffff) drop-shadow(0 2px 0 #ffffff) drop-shadow(0 -2px 0 #ffffff) drop-shadow(1.5px 1.5px 0 #ffffff) drop-shadow(-1.5px -1.5px 0 #ffffff) drop-shadow(1.5px -1.5px 0 #ffffff) drop-shadow(-1.5px 1.5px 0 #ffffff) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.22))',
                        }}
                      >
                        <img
                          src={el.stickerImage}
                          alt="贴纸素材"
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      </div>
                    )}

                    {/* Glued down indicator badge */}
                    {el.isGlued && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-sm z-40">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}

                    {/* Active Selection Visual Framing & Corner Resize Handles */}
                    {isSelected && !el.isGlued && (
                      <>
                        {/* Drag indicator in center */}
                        <div className="absolute inset-0 border-2 border-dashed border-amber-500/80 pointer-events-none rounded-lg" />

                        {/* Top-Right Corner Scale Handle */}
                        <div
                          onPointerDown={(e) => handlePointerDownCornerHandle(e, el)}
                          title="拖动调整大小"
                          className="absolute -top-3 -right-3 w-6 h-6 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-40"
                        >
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>

                        {/* Bottom-Right Corner Scale Handle */}
                        <div
                          onPointerDown={(e) => handlePointerDownCornerHandle(e, el)}
                          title="拖动调整大小"
                          className="absolute -bottom-3 -right-3 w-6 h-6 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-40"
                        >
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>

                        {/* Bottom-Left Corner Scale Handle */}
                        <div
                          onPointerDown={(e) => handlePointerDownCornerHandle(e, el)}
                          title="拖动调整大小"
                          className="absolute -bottom-3 -left-3 w-6 h-6 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-40"
                        >
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions: Save, Download, Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="px-5 py-2.5 rounded-2xl bg-white border-2 border-[#263D64]/20 hover:bg-amber-50 text-[#263D64] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>下载作品图片 (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitArtwork}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>送出作品到艺术展大厅</span>
              </button>
            </div>

            {/* Submission feedback banner */}
            {submitFeedback.show && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-xs font-bold space-y-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{submitFeedback.title}</span>
                </div>
                <div className="text-[#263D64]/70">{submitFeedback.msg}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
