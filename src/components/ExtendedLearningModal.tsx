import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { X, Video, BookOpen, CheckCircle, ArrowLeft, Lightbulb } from 'lucide-react';

interface ExtendedLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToStudio: () => void;
}

export const ExtendedLearningModal: React.FC<ExtendedLearningModalProps> = ({
  isOpen,
  onClose,
  onReturnToStudio,
}) => {
  const [reflectionAnswer, setReflectionAnswer] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  if (!isOpen) return null;

  const settings = storageService.getSettings();

  // Extract YouTube ID if valid
  const getEmbedUrl = (url: string) => {
    let videoId = 'zb6YamXD8eU'; // User specified children collage tutorial
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      videoId = match[1];
    }
    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFF5E5] border-4 border-[#263D64]/20 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#263D64]/10 pb-4">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-[#F28C75]" />
            <h2 className="text-xl sm:text-2xl font-black text-[#263D64]">
              延伸学习 · 儿童拼贴画技法微课堂
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-slate-100 text-[#263D64] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Notice */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-bold flex items-center gap-2">
          <span>ℹ️ 提示：本视频仅供拼贴技法拓展，不会取代正式听力通知，请安静观察视频中的折贴技巧。</span>
        </div>

        {/* YouTube Video Player Embed */}
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border-2 border-[#263D64]/15 bg-black">
          <iframe
            src={getEmbedUrl(settings.youtubeVideoUrl)}
            title="儿童拼贴画技法延伸学习"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Watching Tips */}
        <div className="p-4 bg-white rounded-2xl border border-[#263D64]/10 space-y-2">
          <div className="text-xs font-black text-[#263D64] flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-[#F4C66A]" />
            <span>👀 观看小锦囊：</span>
          </div>
          <ul className="text-xs text-[#263D64]/80 space-y-1 list-disc pl-5 font-medium leading-relaxed">
            <li>注意看老师如何先用大块彩色纸铺设底色（天空与草地）。</li>
            <li>观察安全剪刀的拿法，手要握紧剪刀柄，慢慢沿着画好的线剪。</li>
            <li>注意胶水涂抹的量，只要在背面边缘轻轻涂几点，不要涂太多弄湿纸张。</li>
            <li>最后才用闪亮贴纸作为小点缀，使画面更加丰富活泼！</li>
          </ul>
        </div>

        {/* Post-Watch Question */}
        <div className="p-4 bg-[#FFFBF2] rounded-2xl border border-[#F4C66A]/40 space-y-3">
          <div className="text-sm font-black text-[#263D64]">
            🤔 观看后小思考：拼贴画时，应该先贴大背景还是先贴小贴纸？
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'bg_first', label: '① 先贴大背景纸，最后贴小贴纸装饰 (推荐)' },
              { id: 'sticker_first', label: '② 先在白纸上贴满小贴纸，再盖大背景纸' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setReflectionAnswer(opt.id);
                  setIsAnswered(true);
                }}
                className={`p-3 rounded-xl text-xs font-black border-2 text-left transition-all ${
                  reflectionAnswer === opt.id
                    ? 'bg-[#263D64] text-white border-[#263D64] shadow-xs'
                    : 'bg-white text-[#263D64] border-[#263D64]/20 hover:border-[#263D64]/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {isAnswered && (
            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              {reflectionAnswer === 'bg_first'
                ? '✓ 回答完全正确！先大后小、从底到面是做拼贴画的最佳顺序！'
                : '提示：如果先贴小贴纸，大背景纸盖上去就会把贴纸遮住了哦，应该先铺大背景！'}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-[#263D64]/20 text-[#263D64] text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            关闭窗口
          </button>

          <button
            onClick={() => {
              onClose();
              onReturnToStudio();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#F4C66A] hover:bg-[#F4C66A]/90 text-[#263D64] font-black text-xs shadow-md transition-all flex items-center gap-2"
          >
            <span>返回创作工作室</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
