/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  Sparkles,
  GraduationCap,
  ChevronRight,
  Loader2,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { 
  Grade, 
  Subject, 
  ExamType, 
  Difficulty, 
  Exam, 
  ExamSettings 
} from './types';
import { generateExams, generateQuestionImage } from './lib/gemini';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Constants for selection options
 */
const GRADES: Grade[] = [1, 2, 3, 4, 5];
const EXAM_TYPES: ExamType[] = ['Giữa HK1', 'Cuối HK1', 'Giữa HK2', 'Cuối HK2'];
const SUBJECTS: { label: Subject; icon: React.ReactNode }[] = [
  { label: 'Toán', icon: <span className="text-xl">🔢</span> },
  { label: 'Tiếng Việt', icon: <span className="text-xl">📖</span> },
  { label: 'Tiếng Anh', icon: <span className="text-xl">🌍</span> },
  { label: 'Tự nhiên & Xã hội', icon: <span className="text-xl">🌱</span> },
  { label: 'Đạo đức', icon: <span className="text-xl">⭐</span> },
  { label: 'Nghệ thuật', icon: <span className="text-xl">🎨</span> },
];
const DIFFICULTIES: Difficulty[] = ['Dễ', 'Trung bình', 'Khó'];
const SCHOOL_YEARS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030'];

export default function App() {
  // --- States ---
  const [settings, setSettings] = useState<ExamSettings>({
    schoolYear: '2025-2026',
    examType: 'Cuối HK1',
    grade: 3,
    subject: 'Toán',
    difficulty: 'Trung bình',
    multipleChoiceCount: 8,
    essayCount: 4,
    examCount: 3,
    useWebSearch: true,
    generateIllustrations: true,
  });

  const [loading, setLoading] = useState(false);
  const [generatedExams, setGeneratedExams] = useState<Exam[]>([]);
  const [showAnswerKeys, setShowAnswerKeys] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'samples' | 'view'>('create');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUploadPreview(base64);
        setSettings(prev => ({ ...prev, sampleImage: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const exams = await generateExams(settings);
      
      // If illustrations are enabled, generate them for questions that have prompts
      if (settings.generateIllustrations) {
        for (const exam of exams) {
          for (const q of exam.questions) {
            if (q.illustrationPrompt) {
              q.imageUrl = await generateQuestionImage(q.illustrationPrompt);
            }
          }
        }
      }

      setGeneratedExams(exams);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setActiveTab('view');
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo đề thi. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async (examId: string) => {
    const element = document.getElementById(`exam-${examId}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`De_Thi_${settings.subject}_Lop_${settings.grade}_Code_${examId.slice(0,4)}.pdf`);
    } catch (error) {
      console.error("Lỗi xuất PDF:", error);
    }
  };

  const exportAllToPDF = async () => {
    for (const exam of generatedExams) {
      await exportToPDF(exam.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 pb-12">
      {/* Header */}
      <header className="header-bg text-white py-4 px-8 sticky top-0 z-50 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF4500] p-2 rounded-lg shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">Đề Thi Tiểu Học AI</h1>
              <p className="text-xs text-slate-400 font-medium">Kết nối tri thức với cuộc sống • Lớp 1–5</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('create')}
              className={cn(
                "text-sm font-semibold transition-all pb-1 border-b-2",
                activeTab === 'create' ? "text-white border-[#FF4500]" : "text-slate-400 border-transparent hover:text-orange-400 hover:border-orange-400"
              )}
            >
              Tạo đề
            </button>
            <button 
              onClick={() => setActiveTab('samples')}
              className={cn(
                "text-sm font-semibold transition-all pb-1 border-b-2",
                activeTab === 'samples' ? "text-white border-[#FF4500]" : "text-slate-400 border-transparent hover:text-orange-400 hover:border-orange-400"
              )}
            >
              Đề mẫu
            </button>
            <button 
              onClick={() => setActiveTab('view')}
              className={cn(
                "text-sm font-semibold transition-all pb-1 border-b-2",
                activeTab === 'view' ? "text-white border-[#FF4500]" : "text-slate-400 border-transparent hover:text-orange-400 hover:border-orange-400"
              )}
            >
              Xem đề
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm transition font-medium">
              Đăng nhập
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Creation Panel */}
        <div className={cn(
          "lg:col-span-4",
          activeTab !== 'create' && "hidden lg:block"
        )}>
          <div className="card p-6 sticky top-28 space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">1. Cài đặt cơ bản</h2>
            </div>

            <div className="space-y-6">
              {/* School Year */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Năm học</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                  value={settings.schoolYear}
                  onChange={(e) => setSettings({...settings, schoolYear: e.target.value})}
                >
                  {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Exam Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Kỳ kiểm tra</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXAM_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setSettings({...settings, examType: type})}
                      className={cn(
                        "py-2.5 px-3 border rounded-md text-sm font-medium transition-all",
                        settings.examType === type 
                          ? "active-btn" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Lớp</label>
                <div className="grid grid-cols-5 gap-2">
                  {GRADES.map(grade => (
                    <button
                      key={grade}
                      onClick={() => setSettings({...settings, grade})}
                      className={cn(
                        "py-2.5 border rounded-md text-sm font-bold transition-all",
                        settings.grade === grade
                          ? "active-btn"
                          : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                      )}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Môn học</label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {SUBJECTS.map(sub => (
                    <button
                      key={sub.label}
                      onClick={() => setSettings({...settings, subject: sub.label})}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 border rounded-md text-sm font-medium transition-all",
                        settings.subject === sub.label
                          ? "active-btn"
                          : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                      )}
                    >
                      <span className="text-sm">{sub.icon}</span>
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Độ khó</label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  {DIFFICULTIES.map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSettings({...settings, difficulty: diff})}
                      className={cn(
                        "flex-1 py-2 rounded-md text-xs font-bold transition-all",
                        settings.difficulty === diff
                          ? "bg-[#FF4500] text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">2. Cấu trúc đề</h2>
                
                <div className="space-y-6">
                  {/* Exam Count Slider */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-600">Số lượng mã đề</span>
                      <span className="text-[#FF4500] font-bold text-lg">{settings.examCount}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={settings.examCount}
                      onChange={(e) => setSettings({...settings, examCount: parseInt(e.target.value)})}
                      className="custom-slider"
                    />
                  </div>

                  {/* Question Count */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold block">Trắc nghiệm</label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => setSettings({...settings, multipleChoiceCount: Math.max(0, settings.multipleChoiceCount - 1)})}
                          className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-bold text-slate-800 text-sm border-x border-slate-200">{settings.multipleChoiceCount}</span>
                        <button 
                          onClick={() => setSettings({...settings, multipleChoiceCount: Math.min(30, settings.multipleChoiceCount + 1)})}
                          className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold block">Tự luận</label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                        <button 
                          onClick={() => setSettings({...settings, essayCount: Math.max(0, settings.essayCount - 1)})}
                          className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-bold text-slate-800 text-sm border-x border-slate-200">{settings.essayCount}</span>
                        <button 
                          onClick={() => setSettings({...settings, essayCount: Math.min(20, settings.essayCount + 1)})}
                          className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Features */}
              <div className="pt-4 border-t border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">3. Tính năng AI</h2>
                <div className="space-y-3">
                  <Checkbox 
                    label="RAG: Truy xuất web thời gian thực" 
                    checked={settings.useWebSearch} 
                    onChange={(v) => setSettings({...settings, useWebSearch: v})}
                    icon={<Search className="w-3 h-3 text-blue-500" />}
                  />
                  <Checkbox 
                    label="Tự động vẽ hình minh họa" 
                    checked={settings.generateIllustrations} 
                    onChange={(v) => setSettings({...settings, generateIllustrations: v})}
                    icon={<Sparkles className="w-4 h-4 text-purple-500" />}
                  />
                </div>
              </div>

              {/* Sample Upload Area */}
              <div className="pt-4 space-y-3">
                 <div className="relative group overflow-hidden">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(
                      "card border-dashed border-2 p-5 flex flex-col items-center justify-center text-center space-y-2 transition-all min-h-[140px]",
                      uploadPreview 
                        ? "border-orange-500 bg-orange-50/30" 
                        : "border-slate-300 hover:bg-slate-50"
                    )}>
                      {uploadPreview ? (
                        <div className="relative w-full">
                          <img src={uploadPreview} className="w-full h-24 object-cover rounded-lg border border-orange-200" alt="Preview" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); setUploadPreview(null); setSettings(s => ({...s, sampleImage: undefined})); }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 z-20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Tải lên đề mẫu (OCR)</p>
                            <p className="text-[11px] text-slate-400">AI phân tích ảnh chụp để tạo cấu trúc tương tự</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
              </div>

              {/* Execute Button */}
              <button
                disabled={loading}
                onClick={handleGenerate}
                className={cn(
                  "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white transition-all shadow-lg active:scale-95",
                  loading 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "accent-orange shadow-orange-900/10"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>ĐANG XỬ LÝ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>BẮT ĐẦU TẠO ĐỀ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Preview Panel */}
        <div className={cn(
          "lg:col-span-8",
          activeTab === 'create' && "hidden lg:block"
        )}>
          {generatedExams.length > 0 ? (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="card p-4 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-lg text-slate-800">KẾT QUẢ TẠO ĐỀ</h3>
                  <span className="bg-[#FF4500] text-white px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {generatedExams.length} Đề
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all border",
                      showAnswerKeys ? "bg-purple-100 text-purple-600 border-purple-200" : "bg-white text-slate-600 border-slate-200 hover:border-purple-200"
                    )}
                  >
                    {showAnswerKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showAnswerKeys ? "Ẩn đáp án" : "Xem đáp án"}</span>
                  </button>
                  <button 
                    onClick={exportAllToPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold transition-all hover:bg-slate-700 shadow-md active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải tất cả</span>
                  </button>
                  <button 
                    onClick={() => setGeneratedExams([])}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Exams list */}
              <div className="space-y-12">
                {generatedExams.map((exam, index) => (
                  <ExamPreviewCard 
                    key={exam.id} 
                    exam={exam} 
                    index={index} 
                    showAnswers={showAnswerKeys}
                    onExport={() => exportToPDF(exam.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ready State Image Card */}
              <div className="card p-10 bg-slate-900 border-none relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-white text-3xl font-extrabold tracking-tight italic">Sẵn sàng kiến tạo đề thi</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                      Hệ thống AI đã nạp chương trình "Kết nối tri thức với cuộc sống" cho năm học {settings.schoolYear}.
                    </p>
                  </div>
                  <button 
                    onClick={handleGenerate}
                    className="bg-[#FF4500] hover:bg-orange-500 text-white font-bold py-4 px-12 rounded-full shadow-lg shadow-orange-900/40 transition flex items-center space-x-3 mx-auto active:scale-95"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>BẮT ĐẦU TẠO ĐỀ</span>
                  </button>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-6 border-slate-100">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Truy xuất chuẩn xác</h4>
                  <p className="text-sm text-slate-500">Nội dung được cập nhật từ các nguồn dữ liệu giáo dục tin cậy nhất hiện nay.</p>
                </div>
                <div className="card p-6 border-slate-100">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Đa dạng hóa đề thi</h4>
                  <p className="text-sm text-slate-500">Tự động xáo trộn và thay đổi số liệu để tạo hàng chục mã đề chất lượng.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * --- Sub-components ---
 */

function Counter({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      <button 
        onClick={() => onChange(value - 1)}
        className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold"
      >
        -
      </button>
      <span className="flex-1 text-center font-bold text-slate-800 text-sm border-x border-slate-200 min-w-[40px]">{value}</span>
      <button 
        onClick={() => onChange(value + 1)}
        className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold"
      >
        +
      </button>
    </div>
  );
}

function Checkbox({ label, checked, onChange, icon }: { label: string, checked: boolean, onChange: (v: boolean) => void, icon: React.ReactNode }) {
  return (
    <label className={cn(
      "flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all",
      checked ? "bg-slate-50 border-slate-200" : "bg-white border-slate-100 opacity-60 hover:opacity-100"
    )}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 accent-slate-800 border-slate-300 rounded cursor-pointer"
      />
    </label>
  );
}

interface ExamPreviewCardProps {
  key?: React.Key;
  exam: Exam;
  index: number;
  showAnswers: boolean;
  onExport: () => void | Promise<void>;
}

function ExamPreviewCard({ exam, index, showAnswers, onExport }: ExamPreviewCardProps) {
  return (
    <div className="group relative">
      {/* Export Action Floating */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={onExport}
          className="p-3 bg-white text-slate-800 rounded-full shadow-xl border border-slate-200 hover:bg-slate-800 hover:text-white transition-all active:scale-95"
          title="Tải đề thi"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 print:shadow-none print:border-none">
        {/* Printable Section */}
        <div id={`exam-${exam.id}`} className="bg-white p-12 md:px-16 md:py-16 min-h-[1000px] print:p-0">
          {/* Header Paper Style */}
          <div className="grid grid-cols-2 gap-8 mb-8 border-b border-slate-200 pb-8">
            <div className="space-y-3 font-serif">
              <p className="text-sm">Trường Tiểu Học: ...........................................</p>
              <p className="text-sm">Lớp: {exam.grade} / .......................................................</p>
              <p className="text-sm">Họ và tên: ...........................................................</p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-bold text-xl uppercase tracking-tighter">{exam.examType}</p>
              <p className="text-sm">NĂM HỌC: {exam.schoolYear}</p>
              <p className="text-sm font-semibold">Môn: {exam.subject.toUpperCase()} (Mã {exam.code})</p>
              <p className="text-xs italic pt-2">Thời gian: {exam.timeAllowed} phút</p>
            </div>
          </div>

          {/* Feedback Block */}
          <div className="flex border border-slate-800 mb-10 h-24">
             <div className="w-32 border-r border-slate-800 flex items-center justify-center font-bold uppercase text-sm">Điểm</div>
             <div className="flex-1 p-3 space-y-3">
                <span className="font-bold text-[11px] uppercase text-slate-500">Lời phê của giáo viên</span>
                <div className="h-0.5 bg-slate-50 border-t border-dashed border-slate-300"></div>
                <div className="h-0.5 bg-slate-50 border-t border-dashed border-slate-300"></div>
             </div>
          </div>

          <div className="space-y-12">
            {/* Section I: Multiple Choice */}
            {exam.questions.filter(q => q.type === 'multiple-choice').length > 0 && (
              <section>
                <h4 className="font-bold text-lg mb-6 flex items-center gap-3">
                  <span className="w-7 h-7 bg-slate-900 text-white rounded text-xs flex items-center justify-center">I</span>
                  TRẮC NGHIỆM: Chọn đáp án đúng nhất:
                </h4>
                <div className="space-y-10 pl-6 border-l border-slate-100">
                  {exam.questions.filter(q => q.type === 'multiple-choice').map((q, idx) => (
                    <div key={q.id} className="relative">
                      <div className="absolute -left-10 top-0 font-bold text-slate-400">c.{idx + 1}</div>
                      <div className="space-y-6">
                        <p className="font-medium text-[1.1rem] leading-relaxed text-slate-800">{q.question}</p>
                        
                        {q.imageUrl && (
                          <div className="my-6 max-w-md">
                            <img src={q.imageUrl} alt="illustration" className="rounded-xl border border-slate-100 shadow-sm" referrerPolicy="no-referrer" />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                          {q.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-3 group/opt">
                              <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-[10px] font-bold group-hover/opt:border-orange-500 group-hover/opt:text-orange-500 transition-colors uppercase">
                                {String.fromCharCode(65 + i)}
                              </div>
                              <span className="text-slate-700 text-sm">{opt}</span>
                            </div>
                          ))}
                        </div>

                        {showAnswers && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-6 p-4 bg-orange-50 text-orange-800 rounded-xl text-[13px] border border-orange-100"
                          >
                            <span className="font-bold">Giải đáp:</span> Đáp án <span className="font-black text-orange-600">{q.answer}</span>. {q.explanation}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Section II: Essay */}
            {exam.questions.filter(q => q.type === 'essay').length > 0 && (
              <section>
                <h4 className="font-bold text-lg mb-6 flex items-center gap-3 text-slate-800">
                  <span className="w-7 h-7 bg-slate-900 text-white rounded text-xs flex items-center justify-center">II</span>
                  TỰ LUẬN:
                </h4>
                <div className="space-y-12 pl-6 border-l border-slate-100">
                  {exam.questions.filter(q => q.type === 'essay').map((q, idx) => (
                    <div key={q.id} className="relative">
                      <div className="absolute -left-10 top-0 font-bold text-slate-400">b.{idx + 1}</div>
                      <div className="space-y-4">
                        <p className="font-medium text-[1.1rem] leading-relaxed text-slate-800">{q.question}</p>
                        
                        {q.imageUrl && (
                          <div className="my-6 max-w-md">
                             <img src={q.imageUrl} alt="illustration" className="rounded-xl border border-slate-100 shadow-sm" referrerPolicy="no-referrer" />
                          </div>
                        )}

                        {/* Blank lines for written answers */}
                        <div className="space-y-8 pt-6">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-px w-full border-t border-dashed border-slate-300"></div>
                          ))}
                        </div>

                        {showAnswers && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-6 p-4 bg-slate-100 text-slate-700 rounded-xl text-[13px] border border-slate-200"
                          >
                            <div className="font-bold mb-1">Hướng dẫn giải:</div>
                            <p className="leading-relaxed">{q.answer}</p>
                            {q.explanation && <p className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-500 italic">{q.explanation}</p>}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


