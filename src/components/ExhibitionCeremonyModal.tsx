import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, GameProgress } from '../types';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { audioService } from '../services/audio';
import {
  Sparkles,
  Award,
  Download,
  FileText,
  X,
  CheckCircle,
  Sun,
  Eye,
  RotateCcw,
  Palette,
} from 'lucide-react';

interface ExhibitionCeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile | null;
  progress: GameProgress;
  onOpenDraw?: () => void;
}

export const ExhibitionCeremonyModal: React.FC<ExhibitionCeremonyModalProps> = ({
  isOpen,
  onClose,
  student,
  progress,
  onOpenDraw,
}) => {
  // Animation phases:
  // 'intro' (lights dimming up) -> 'collage' (pieces coming together) -> 'curtain' (curtains slide open) -> 'grand' (final exhibition open celebration)
  const [animStage, setAnimStage] = useState<'intro' | 'collage' | 'curtain' | 'grand'>('intro');

  // Certificate download stages
  // false -> user hasn't downloaded image yet
  // true -> user clicked and downloaded image, revealing the PDF download button!
  const [hasDownloadedImage, setHasDownloadedImage] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const certCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setAnimStage('intro');
      setHasDownloadedImage(false);
      setStatusMsg('');
      return;
    }

    // Sequence the gentle opening animation
    const t1 = setTimeout(() => setAnimStage('collage'), 1000);
    const t2 = setTimeout(() => setAnimStage('curtain'), 2200);
    const t3 = setTimeout(() => {
      setAnimStage('grand');
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {
        // ignore
      }
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const nickname = student?.nickname || '彩虹小画师';
  const todayDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Render the certificate onto a high-res hidden canvas for PNG download & PDF embedding
  const drawCertificateToCanvas = (canvas: HTMLCanvasElement) => {
    // A4 Landscape aspect ratio: 1200 x 850
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Background Paper (Warm cream watercolor feel)
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, 1200, 850);

    // 2. Decorative Outer Border (Double ornate golden frame)
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, 1140, 790);

    ctx.strokeStyle = '#FDE68A';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, 1104, 754);

    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(56, 56, 1088, 738);
    ctx.setLineDash([]); // reset dash

    // 3. Ornate Corner Medallions
    const corners = [
      [48, 48],
      [1152, 48],
      [48, 802],
      [1152, 802],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Header Badge
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.roundRect(450, 75, 300, 42, 21);
    ctx.fill();
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('声音寻宝大冒险 · 荣誉奖状', 600, 103);

    // 5. Main Title: 《失落的艺术展：声音密码大冒险》
    ctx.fillStyle = '#1E3A8A';
    ctx.font = '900 42px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('《失落的艺术展：声音密码大冒险》', 600, 180);

    ctx.fillStyle = '#D97706';
    ctx.font = 'bold 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('校园艺术展 · 小小荣誉策展人', 600, 222);

    // 6. Recipient (Student Game Nickname)
    ctx.fillStyle = '#78350F';
    ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('特此授予小寻宝员：', 600, 290);

    ctx.fillStyle = '#BE123C';
    ctx.font = '900 46px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(nickname, 600, 350);

    // Decorative underline under nickname
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(420, 370);
    ctx.lineTo(780, 370);
    ctx.stroke();

    // 7. Commendation Text
    ctx.fillStyle = '#374151';
    ctx.font = 'normal 21px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(
      '恭喜你在本次声音艺术展大冒险中，展现了极其专注的静心聆听好习惯，',
      600,
      430
    );
    ctx.fillText(
      '成功通过声音档案室、失落材料搜查局、密码实验室与材料仓库的全部挑战，',
      600,
      470
    );
    ctx.fillText(
      '集齐四枚艺术展收藏徽章，与伙伴齐心完成了盛大的巨型拼贴画杰作！',
      600,
      510
    );

    // 8. 4 Badge Icons Silhouettes at bottom
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.roundRect(360, 560, 480, 70, 20);
    ctx.fill();
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#92400E';
    ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('已集齐：闪亮星星 · 艺术画框 · 魔法灯笼 · 展览钥匙', 600, 602);

    // 9. Signatures and Date
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4B5563';
    ctx.font = 'bold 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`颁发日期：${todayDate}`, 120, 720);

    ctx.textAlign = 'right';
    ctx.fillText('指导老师签名：________________', 1080, 720);

    // Official Stamp Seal
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(980, 660, 46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.font = 'bold 15px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('艺术展组委会', 980, 655);
    ctx.fillText('审核认证', 980, 675);
  };

  // Stage 1: Generate & Download PNG Image
  const handleDownloadImage = () => {
    try {
      const canvas = document.createElement('canvas');
      drawCertificateToCanvas(canvas);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${nickname}_艺术展大冒险荣誉奖状.png`;
      link.href = dataUrl;
      link.click();

      setHasDownloadedImage(true);
      setStatusMsg('✓ 奖状图片下载成功！已为你开启【下载 PDF 奖状】按钮！');
      audioService.playCelebrationChime();
    } catch (e) {
      console.error(e);
      setStatusMsg('图片生成稍有延迟，请点击重试。');
    }
  };

  // Stage 2: Generate & Download real A4 Landscape PDF
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const canvas = document.createElement('canvas');
      drawCertificateToCanvas(canvas);
      const imgData = canvas.toDataURL('image/png', 0.95);

      // Create A4 Landscape PDF (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Fit 297mm x 210mm with 0 margins
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`${nickname}_艺术展大冒险荣誉奖状.pdf`);

      audioService.playCelebrationChime();
      setStatusMsg('✓ 奖状 PDF 文件已成功生成并下载！可随时打印留念！');
    } catch (e) {
      console.error(e);
      setStatusMsg('PDF 生成失败，请重试。');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FFFDF9] border-4 border-[#F59E0B] rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-6 space-y-6 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-slate-100 text-[#263D64] transition-colors border border-amber-200 cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Exhibition Opening Animated Showcase */}
        <div className="relative rounded-3xl overflow-hidden border-3 border-amber-400 bg-slate-900 min-h-[280px] sm:min-h-[340px] flex items-center justify-center text-center p-6 shadow-inner">
          {/* Ambient Lighting Overlay */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${
              animStage === 'intro'
                ? 'opacity-20 bg-amber-900'
                : 'opacity-100 bg-gradient-to-t from-amber-950/80 via-transparent to-amber-500/20'
            }`}
          />

          {/* Golden Curtains Slide */}
          <div
            className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-900 to-amber-800 transition-transform duration-1000 z-10 ${
              animStage === 'grand' || animStage === 'curtain'
                ? '-translate-x-full'
                : 'translate-x-0'
            }`}
          />
          <div
            className={`absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-red-900 to-amber-800 transition-transform duration-1000 z-10 ${
              animStage === 'grand' || animStage === 'curtain'
                ? 'translate-x-full'
                : 'translate-x-0'
            }`}
          />

          {/* Masterpiece Showcase Behind Curtains */}
          <div className="relative z-0 max-w-lg mx-auto space-y-4">
            <div className="relative rounded-2xl overflow-hidden border-4 border-amber-300 shadow-2xl">
              <img
                src="/src/assets/images/hero_art_exhibition_1794245343012.jpg"
                alt="完成的盛大艺术展巨型拼贴画"
                className="w-full h-48 sm:h-56 object-cover"
              />
              {/* Completed Stamp Seal */}
              <div className="absolute top-3 right-3 bg-amber-400/95 text-amber-950 px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                <span>巨型拼贴画圆满完工</span>
              </div>
            </div>

            <div className="text-white space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide drop-shadow-md">
                艺术展正式开放！
              </h2>
              <p className="text-xs sm:text-sm font-bold text-amber-100">
                太棒了！你完成了声音寻宝大冒险，所有展厅灯光亮起！
              </p>
            </div>
          </div>
        </div>

        {/* 2. Certificate Actions */}
        <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-5 text-center space-y-4">
          <div>
            <h3 className="text-base font-black text-[#263D64]">
              荣获《小小荣誉策展人》专属奖状
            </h3>
            <p className="text-xs text-[#263D64]/70 mt-1">
              小寻宝员 <strong className="text-amber-800 font-black">{nickname}</strong>
              ，点击下方按钮领取你的正式荣誉奖状！
            </p>
          </div>

          {/* Two-Stage Download Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Stage 1: Download Image */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>领取我的奖状 (PNG 图片)</span>
            </button>

            {/* Stage 2: Download PDF (Appears ONLY after Stage 1 is clicked!) */}
            {hasDownloadedImage && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-in fade-in zoom-in-95 duration-200"
              >
                <FileText className="w-4 h-4" />
                <span>{isGeneratingPdf ? '正在生成 PDF...' : '下载 PDF 奖状 (高清可打印)'}</span>
              </button>
            )}
          </div>

          {/* Status / Success Message */}
          {statusMsg && (
            <p className="text-xs font-bold text-emerald-800 animate-in fade-in duration-200">
              {statusMsg}
            </p>
          )}

          {/* Creative Studio Entrance Button (Unlocks along with art exhibition opening) */}
          {onOpenDraw && (
            <div className="pt-3 border-t border-amber-200">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDraw();
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#263D64] hover:bg-[#263D64]/90 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Palette className="w-4 h-4 text-amber-400" />
                <span>前往「创艺园地」开启自由拼贴创作 →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
