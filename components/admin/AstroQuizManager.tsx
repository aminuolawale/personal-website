"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Check, Image as ImageIcon, Pencil, Plus, Save, Trash2 } from "lucide-react";
import type { AstroQuiz, AstroQuizOption, AstroQuizQuestion, QuizMarquee } from "@/lib/schema";

type AdminOption = { id?: number; label: string; isCorrect: boolean };
type AdminQuestion = { id?: number; question: string; marquee: QuizMarquee | null; options: AdminOption[] };
type AdminQuiz = AstroQuiz & { questions: Array<AstroQuizQuestion & { options: AstroQuizOption[] }> };
type DraftQuiz = {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
  published: boolean;
  position: number;
  questions: AdminQuestion[];
};

const EMPTY_QUESTION: AdminQuestion = {
  question: "",
  marquee: null,
  options: [
    { label: "", isCorrect: true },
    { label: "", isCorrect: false },
  ],
};

function createDraft(): DraftQuiz {
  return {
    title: "",
    description: "",
    imageUrl: "",
    published: false,
    position: 99,
    questions: [{ ...EMPTY_QUESTION, options: EMPTY_QUESTION.options.map((option) => ({ ...option })) }],
  };
}

function fromQuiz(quiz: AdminQuiz): DraftQuiz {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    imageUrl: quiz.imageUrl ?? "",
    published: quiz.published,
    position: quiz.position,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      question: question.question,
      marquee: question.marquee ?? null,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        isCorrect: option.isCorrect,
      })),
    })),
  };
}

function cloneQuestion(question: AdminQuestion): AdminQuestion {
  return {
    question: question.question,
    marquee: question.marquee,
    options: question.options.map((option) => ({ label: option.label, isCorrect: option.isCorrect })),
  };
}

function clampRegion(region: QuizMarquee): QuizMarquee {
  const x = Math.max(0, Math.min(100, region.x));
  const y = Math.max(0, Math.min(100, region.y));
  const w = Math.max(1, Math.min(100 - x, region.w));
  const h = Math.max(1, Math.min(100 - y, region.h));
  return { x, y, w, h };
}

export default function AstroQuizManager() {
  const imageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [draft, setDraft] = useState<DraftQuiz>(createDraft);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  const activeQuestion = draft.questions[activeQuestionIndex] ?? null;

  async function loadQuizzes(): Promise<AdminQuiz[]> {
    const res = await fetch("/api/admin/astro-quizzes");
    const data = res.ok ? await res.json() : [];
    const rows = Array.isArray(data) ? data : [];
    setQuizzes(rows);
    return rows;
  }

  useEffect(() => {
    fetch("/api/admin/astro-quizzes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setQuizzes(Array.isArray(data) ? data : []))
      .catch(() => setQuizzes([]));
  }, []);

  const payload = useMemo(() => ({
    title: draft.title,
    description: draft.description,
    imageUrl: draft.imageUrl || null,
    published: draft.published,
    position: draft.position,
    questions: draft.questions.map((question) => ({
      question: question.question,
      marquee: question.marquee,
      options: question.options.map((option) => ({
        label: option.label,
        isCorrect: option.isCorrect,
      })),
    })),
  }), [draft]);

  function updateQuestion(index: number, patch: Partial<AdminQuestion>) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question
      ),
    }));
  }

  function updateOption(questionIndex: number, optionIndex: number, patch: Partial<AdminOption>) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option, currentOptionIndex) =>
            currentOptionIndex === optionIndex ? { ...option, ...patch } : option
          ),
        };
      }),
    }));
  }

  function markCorrect(questionIndex: number, optionIndex: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question;
        return {
          ...question,
          options: question.options.map((option, currentOptionIndex) => ({
            ...option,
            isCorrect: currentOptionIndex === optionIndex,
          })),
        };
      }),
    }));
  }

  function addQuestion() {
    setDraft((current) => ({ ...current, questions: [...current.questions, cloneQuestion(EMPTY_QUESTION)] }));
    setActiveQuestionIndex(draft.questions.length);
  }

  function removeQuestion(index: number) {
    setDraft((current) => {
      const questions = current.questions.filter((_, questionIndex) => questionIndex !== index);
      return { ...current, questions: questions.length > 0 ? questions : [cloneQuestion(EMPTY_QUESTION)] };
    });
    setActiveQuestionIndex((current) => Math.max(0, current - 1));
  }

  function addOption(questionIndex: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, options: [...question.options, { label: "", isCorrect: false }] }
          : question
      ),
    }));
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex || question.options.length <= 2) return question;
        const nextOptions = question.options
          .filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex)
          .map((option) => ({ ...option }));
        if (!nextOptions.some((option) => option.isCorrect)) {
          nextOptions[0] = { ...nextOptions[0], isCorrect: true };
        }
        return { ...question, options: nextOptions };
      }),
    }));
  }

  function pointerPercent(event: React.PointerEvent<HTMLDivElement>) {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  }

  function startRegion(event: React.PointerEvent<HTMLDivElement>) {
    if (!activeQuestion) return;
    const point = pointerPercent(event);
    if (!point) return;
    dragStartRef.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateQuestion(activeQuestionIndex, { marquee: { x: point.x, y: point.y, w: 1, h: 1 } });
  }

  function updateRegion(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    if (!start) return;
    const point = pointerPercent(event);
    if (!point) return;
    updateQuestion(activeQuestionIndex, {
      marquee: clampRegion({
        x: Math.min(start.x, point.x),
        y: Math.min(start.y, point.y),
        w: Math.abs(point.x - start.x),
        h: Math.abs(point.y - start.y),
      }),
    });
  }

  function endRegion() {
    dragStartRef.current = null;
  }

  async function uploadQuizImage(file: File | null | undefined) {
    if (!file) return;
    setUploadingImage(true);
    setError("");

    try {
      const blob = await upload(`quizzes/${Date.now()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/astro-quizzes/upload",
      });
      setDraft((current) => ({ ...current, imageUrl: blob.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload quiz image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function saveQuiz(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const editingId = draft.id;

    const res = await fetch(editingId ? `/api/admin/astro-quizzes/${editingId}` : "/api/admin/astro-quizzes", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save quiz");
      return;
    }

    if (editingId) {
      const rows = await loadQuizzes();
      const updated = rows.find((quiz) => quiz.id === editingId);
      if (updated) setDraft(fromQuiz(updated));
    } else {
      await loadQuizzes();
      setDraft(createDraft());
      setActiveQuestionIndex(0);
    }
  }

  function editQuiz(quiz: AdminQuiz) {
    setDraft(fromQuiz(quiz));
    setActiveQuestionIndex(0);
    setError("");
  }

  async function deleteQuiz(id: number) {
    if (!confirm("Delete this quiz?")) return;
    const res = await fetch(`/api/admin/astro-quizzes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuizzes((current) => current.filter((quiz) => quiz.id !== id));
      if (draft.id === id) setDraft(createDraft());
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveQuiz} className="border border-surface/10 p-4 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] text-accent uppercase tracking-widest">Astro quiz</p>
            <h2 className="mt-1 text-xl font-semibold text-surface">{draft.id ? "Edit quiz" : "Create quiz"}</h2>
          </div>
          <button
            type="button"
            onClick={() => { setDraft(createDraft()); setActiveQuestionIndex(0); }}
            className="border border-surface/15 px-3 py-2 font-mono text-xs text-muted/60 hover:text-surface"
          >
            New quiz
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/tiff"
          className="hidden"
          onChange={(event) => { void uploadQuizImage(event.target.files?.[0]); }}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Title</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
              className="mt-1 w-full bg-transparent border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
              placeholder="Identify the nebula"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Image URL</span>
            <div className="mt-1 flex">
              <input
                value={draft.imageUrl}
                onChange={(e) => setDraft((current) => ({ ...current, imageUrl: e.target.value }))}
                className="w-full bg-transparent border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
                placeholder="https://..."
              />
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="border border-l-0 border-surface/15 px-3 font-mono text-xs text-muted/55 transition-colors hover:text-accent disabled:opacity-50"
              >
                {uploadingImage ? "Uploading..." : "Upload"}
              </button>
            </div>
          </label>
        </div>

        <label className="block">
          <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Description</span>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
            className="mt-1 min-h-20 w-full bg-transparent border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
          />
        </label>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-muted/70">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft((current) => ({ ...current, published: e.target.checked }))}
              className="accent-accent"
            />
            Published
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-muted/70">
            <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Position</span>
            <input
              type="number"
              value={draft.position}
              onChange={(e) => setDraft((current) => ({ ...current, position: Number(e.target.value) }))}
              className="w-20 bg-transparent border border-surface/15 px-2 py-1 text-sm text-surface focus:outline-none focus:border-accent/50"
            />
          </label>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5">
          <div className="space-y-3">
            {draft.imageUrl ? (
              <div
                ref={imageRef}
                className="relative aspect-[4/3] overflow-hidden border border-surface/10 bg-surface/[0.03] touch-none"
                onPointerDown={startRegion}
                onPointerMove={updateRegion}
                onPointerUp={endRegion}
                onPointerCancel={endRegion}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.imageUrl} alt="" className="h-full w-full object-contain pointer-events-none select-none" />
                {activeQuestion?.marquee && (
                  <div
                    className="absolute border-2 border-accent shadow-[0_0_24px_rgba(56,189,248,0.45)]"
                    style={{
                      left: `${activeQuestion.marquee.x}%`,
                      top: `${activeQuestion.marquee.y}%`,
                      width: `${activeQuestion.marquee.w}%`,
                      height: `${activeQuestion.marquee.h}%`,
                    }}
                  />
                )}
              </div>
            ) : (
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-[4/3] w-full items-center justify-center border border-surface/10 bg-surface/[0.02] transition-colors hover:border-accent/35 hover:bg-accent/[0.04] disabled:opacity-50"
              >
                <div className="text-center">
                  <ImageIcon className="mx-auto text-muted/25" size={28} />
                  <p className="mt-2 font-mono text-xs text-muted/30">
                    {uploadingImage ? "Uploading image..." : "Click to upload an image"}
                  </p>
                  <p className="mt-1 text-xs text-muted/35">You can also paste an image URL above.</p>
                </div>
              </button>
            )}
            <p className="text-xs text-muted/40">Drag over the image to set the active question region.</p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {draft.questions.map((question, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveQuestionIndex(index)}
                  className={`h-8 w-8 border font-mono text-xs ${
                    activeQuestionIndex === index ? "border-accent text-accent" : "border-surface/15 text-muted/45"
                  }`}
                  aria-label={`Edit question ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex h-8 items-center gap-1 border border-surface/15 px-2 font-mono text-xs text-muted/60 hover:text-accent"
              >
                <Plus size={13} />
                Question
              </button>
            </div>

            {activeQuestion && (
              <div className="space-y-3 border border-surface/10 p-3">
                <label className="block">
                  <span className="font-mono text-[10px] text-muted/40 uppercase tracking-widest">Question</span>
                  <textarea
                    value={activeQuestion.question}
                    onChange={(e) => updateQuestion(activeQuestionIndex, { question: e.target.value })}
                    className="mt-1 min-h-20 w-full bg-transparent border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
                  />
                </label>

                <div className="space-y-2">
                  {activeQuestion.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => markCorrect(activeQuestionIndex, optionIndex)}
                        className={`h-8 w-8 shrink-0 border ${option.isCorrect ? "border-accent text-accent" : "border-surface/15 text-muted/35"}`}
                        aria-label={`Mark option ${optionIndex + 1} correct`}
                      >
                        {option.isCorrect && <Check className="mx-auto" size={14} />}
                      </button>
                      <input
                        value={option.label}
                        onChange={(e) => updateOption(activeQuestionIndex, optionIndex, { label: e.target.value })}
                        className="min-w-0 flex-1 bg-transparent border border-surface/15 px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent/50"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(activeQuestionIndex, optionIndex)}
                        className="p-2 text-muted/35 hover:text-red-400"
                        aria-label={`Remove option ${optionIndex + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addOption(activeQuestionIndex)}
                    className="inline-flex items-center gap-2 border border-surface/15 px-3 py-2 font-mono text-xs text-muted/60 hover:text-accent"
                  >
                    <Plus size={13} />
                    Option
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQuestion(activeQuestionIndex, { marquee: null })}
                    className="border border-surface/15 px-3 py-2 font-mono text-xs text-muted/60 hover:text-surface"
                  >
                    Clear region
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(activeQuestionIndex)}
                    className="border border-red-400/25 px-3 py-2 font-mono text-xs text-red-300 hover:bg-red-400/10"
                  >
                    Remove question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 border border-accent/40 px-4 py-2 font-mono text-xs text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "Saving..." : draft.id ? "Update Quiz" : "Save Quiz"}
        </button>
      </form>

      <div className="border border-surface/10 divide-y divide-surface/[0.06]">
        {quizzes.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-xs text-muted/30">No quizzes created.</p>
        ) : quizzes.map((quiz) => (
          <div key={quiz.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm text-surface font-medium">{quiz.title}</p>
              <p className="mt-1 font-mono text-[10px] text-muted/45">
                {quiz.questions.length} questions · {quiz.published ? "Published" : "Draft"}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => editQuiz(quiz)}
                className="inline-flex items-center gap-1.5 border border-surface/10 px-2 py-1.5 font-mono text-[10px] text-muted/45 transition-colors hover:border-accent/35 hover:text-accent"
                aria-label={`Edit ${quiz.title}`}
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => deleteQuiz(quiz.id)}
                className="p-1.5 text-muted/35 hover:text-red-400 transition-colors"
                aria-label={`Delete ${quiz.title}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
