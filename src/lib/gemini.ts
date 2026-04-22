/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Exam, ExamSettings, Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * System instruction for the AI to behave as a Vietnamese elementary teacher
 */
const SYSTEM_INSTRUCTION = `Bạn là một Chuyên gia Giáo dục Tiểu học cao cấp tại Việt Nam.
Nhiệm vụ của bạn là tạo đề thi cho học sinh tiểu học.
QUY TẮC QUAN TRỌNG:
1. LUÔN bám sát bộ sách "Kết nối tri thức với cuộc sống" của Bộ Giáo dục & Đào tạo Việt Nam.
2. Phân bậc trình độ:
   - Lớp 1: Phép tính cộng/trừ phạm vi 10, 20, 100. Không "có nhớ" trừ khi đặc biệt yêu cầu. Tiếng Việt tập trung đánh vần, từ đơn giản.
   - Lớp 2-5: Độ khó tăng dần theo phân phối chương trình.
3. Đề thi phải có 100% Tiếng Việt, hành văn sư phạm, gần gũi với trẻ em.
4. Cấu trúc JSON trả về phải chính xác theo yêu cầu.
5. Nếu có yêu cầu minh họa (illustrationPrompt), hãy mô tả chi tiết bằng tiếng Anh để AI tạo hình ảnh sử dụng.`;

/**
 * Generate exams using Gemini
 */
export async function generateExams(settings: ExamSettings): Promise<Exam[]> {
  const prompt = `Hãy tạo ${settings.examCount} mã đề thi khác nhau cho:
- Lớp: ${settings.grade}
- Môn: ${settings.subject}
- Kỳ thi: ${settings.examType}
- Năm học: ${settings.schoolYear}
- Độ khó: ${settings.difficulty}
- Số câu trắc nghiệm: ${settings.multipleChoiceCount}
- Số câu tự luận: ${settings.essayCount}
${settings.useWebSearch ? "- Hãy tra cứu chương trình 'Kết nối tri thức với cuộc sống' mới nhất cho môn này." : ""}
${settings.generateIllustrations ? "- Đề xuất mô tả hình ảnh (illustrationPrompt) cho các câu hỏi cần hình ảnh (VD: hình học, con vật)." : ""}
${settings.sampleImage ? "- Dựa trên phong cách và kiến thức của ảnh mẫu được cung cấp." : ""}

Mỗi đề phải có mã đề khác nhau (VD: 001, 002...).
Thời gian làm bài mặc định: 40 phút cho Lớp 1-2, 60 phút cho Lớp 3-5.

Trả về mảng JSON các đối tượng Exam. Cấu trúc mỗi Question:
{
  "type": "multiple-choice" | "essay",
  "question": string,
  "options": string[] (nếu là trắc nghiệm, 4 đáp án A, B, C, D),
  "answer": string,
  "explanation": string,
  "illustrationPrompt": string (nếu cần)
}`;

  try {
    const parts: any[] = [{ text: prompt }];
    
    if (settings.sampleImage) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: settings.sampleImage.split(",")[1]
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    const data = JSON.parse(response.text || "[]");
    
    // Transform to full Exam objects
    return data.map((examData: any, index: number) => ({
      ...examData,
      id: crypto.randomUUID(),
      code: examData.code || `00${index + 1}`,
      title: `${settings.examType.toUpperCase()} - MÔN ${settings.subject.toUpperCase()}`,
      grade: settings.grade,
      subject: settings.subject,
      examType: settings.examType,
      schoolYear: settings.schoolYear,
      timeAllowed: settings.grade <= 2 ? 40 : 60,
      questions: (examData.questions || []).map((q: any) => ({
        ...q,
        id: crypto.randomUUID()
      })),
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Lỗi tạo đề thi AI:", error);
    throw error;
  }
}

/**
 * Generate an image for a question prompt
 */
export async function generateQuestionImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Cartoon style for elementary school children, bright colors, friendly, clean lines, simple background: ${prompt}` }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (error) {
    console.error("Lỗi tạo hình ảnh minh họa:", error);
    return '';
  }
}
