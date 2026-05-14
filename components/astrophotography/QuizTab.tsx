"use client";

import { useEffect, useMemo, useState } from "react";
import * as NextAuthReact from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Camera, LogIn, Send, Share2 } from "lucide-react";
import RichTextContent from "@/components/RichTextContent";
import type { AstroQuiz, AstroQuizOption, AstroQuizQuestion } from "@/lib/schema";

type QuizListItem = AstroQuiz & { questionCount: number };
type PublicOption = Omit<AstroQuizOption, "isCorrect">;
type PublicQuestion = Omit<AstroQuizQuestion, "createdAt" | "updatedAt"> & { options: PublicOption[] };
type PublicQuiz = AstroQuiz & { questions: PublicQuestion[] };
type SubmitResult = { score: number; total: number; answered: number; complete: boolean };

type ShareableQuiz = Pick<QuizListItem, "id" | "title"> & Partial<Pick<QuizListItem, "description" | "imageUrl" | "questionCount">>;

export function quizShareUrl(quizId: number, origin: string) {
  const url = new URL("/astrophotography", origin);
  url.searchParams.set("tab", "quiz");
  url.searchParams.set("quiz", String(quizId));
  return url.toString();
}

export function quizStoryDisplayUrl(shareUrl: string) {
  const url = new URL(shareUrl);
  return `${url.host}/astro?quiz=${url.searchParams.get("quiz") ?? ""}`;
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);

  lines.forEach((value, index) => {
    const suffix = index === maxLines - 1 && words.join(" ").length > lines.join(" ").length ? "..." : "";
    ctx.fillText(`${value}${suffix}`, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

async function loadStoryImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export async function createQuizStoryFile(quiz: ShareableQuiz, shareUrl: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create story image");

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(0.48, "#0f172a");
  gradient.addColorStop(1, "#111827");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = "rgba(56,189,248,0.10)";
  for (let i = 0; i < 80; i += 1) {
    const x = (i * 137) % 1080;
    const y = (i * 311) % 1920;
    const size = i % 5 === 0 ? 3 : 2;
    ctx.fillRect(x, y, size, size);
  }

  if (quiz.imageUrl) {
    const image = await loadStoryImage(quiz.imageUrl);
    if (image) {
      const frameX = 90;
      const frameY = 250;
      const frameW = 900;
      const frameH = 675;
      const scale = Math.min(frameW / image.width, frameH / image.height);
      const drawW = image.width * scale;
      const drawH = image.height * scale;
      ctx.fillStyle = "rgba(15,23,42,0.82)";
      ctx.fillRect(frameX, frameY, frameW, frameH);
      ctx.strokeStyle = "rgba(56,189,248,0.55)";
      ctx.lineWidth = 3;
      ctx.strokeRect(frameX, frameY, frameW, frameH);
      ctx.drawImage(image, frameX + (frameW - drawW) / 2, frameY + (frameH - drawH) / 2, drawW, drawH);
    }
  }

  ctx.fillStyle = "#38bdf8";
  ctx.font = "700 34px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText("ASTROPHOTOGRAPHY QUIZ", 90, 1085);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 78px Inter, system-ui, sans-serif";
  wrapCanvasText(ctx, quiz.title, 90, 1190, 900, 92, 4);

  const description = quiz.description?.trim() || `${quiz.questionCount ?? "Multiple"} questions from the night sky.`;
  ctx.fillStyle = "rgba(226,232,240,0.76)";
  ctx.font = "400 38px Inter, system-ui, sans-serif";
  const afterDescription = wrapCanvasText(ctx, description, 90, 1535, 900, 54, 3);

  ctx.fillStyle = "rgba(56,189,248,0.14)";
  ctx.fillRect(90, Math.max(1650, afterDescription + 70), 900, 140);
  ctx.strokeStyle = "rgba(56,189,248,0.45)";
  ctx.strokeRect(90, Math.max(1650, afterDescription + 70), 900, 140);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 32px ui-monospace, SFMono-Regular, Menlo, monospace";
  wrapCanvasText(ctx, quizStoryDisplayUrl(shareUrl), 125, Math.max(1732, afterDescription + 152), 830, 40, 1);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
  if (!blob) throw new Error("Could not export story image");
  return new File([blob], `astro-quiz-${quiz.id}-story.png`, { type: "image/png" });
}

export default function QuizTab() {
  const { status } = NextAuthReact.useSession();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<PublicQuiz | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sharingStoryQuizId, setSharingStoryQuizId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    fetch(`/api/astro-quizzes?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        const requestedQuizId = Number(new URLSearchParams(window.location.search).get("quiz"));
        const selectedQuiz = rows.find((quiz) => quiz.id === requestedQuizId);
        setQuizzes(rows);
        setActiveQuizId(selectedQuiz?.id ?? rows[0]?.id ?? null);
      })
      .catch(() => setQuizzes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeQuizId || status !== "authenticated") return;
    fetch(`/api/astro-quizzes/${activeQuizId}?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load quiz"))))
      .then((data) => {
        setActiveQuiz(data);
        setAnswers({});
        setCurrentIndex(0);
        setResult(null);
      })
      .catch((err) => setError(err.message));
  }, [activeQuizId, status]);

  const currentQuestion = activeQuiz?.questions[currentIndex] ?? null;
  const answeredCount = activeQuiz
    ? activeQuiz.questions.filter((question) => answers[String(question.id)]).length
    : 0;
  const incompleteCount = activeQuiz ? activeQuiz.questions.length - answeredCount : 0;
  const progress = activeQuiz?.questions.length ? Math.round((answeredCount / activeQuiz.questions.length) * 100) : 0;

  const resultMessage = useMemo(() => {
    if (!result || !activeQuiz) return "";
    if (activeQuiz.resultSummary?.trim()) return activeQuiz.resultSummary;
    const percent = result.total > 0 ? result.score / result.total : 0;
    if (percent === 1) return "<p>Perfect pass. You read the frame with precision.</p>";
    if (percent >= 0.7) return "<p>Strong pass. Your observing eye is getting sharper.</p>";
    return "<p>Good attempt. The night sky map is ready for another pass.</p>";
  }, [activeQuiz, result]);
  const resultHeadline = activeQuiz?.resultHeadline?.trim() || "Quiz complete";

  function chooseOption(questionId: number, optionId: number) {
    setAnswers((current) => ({ ...current, [String(questionId)]: optionId }));
  }

  async function copyQuizLink(url: string) {
    await navigator.clipboard.writeText(url);
    setShareStatus("Quiz link copied.");
    window.setTimeout(() => setShareStatus(""), 2500);
  }

  async function shareQuiz(quiz: ShareableQuiz) {
    const url = quizShareUrl(quiz.id, window.location.origin);

    const shareData = {
      title: quiz.title,
      text: `Try this astrophotography quiz: ${quiz.title}`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyQuizLink(shareData.url);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setShareStatus("Could not share quiz.");
      window.setTimeout(() => setShareStatus(""), 2500);
    }
  }

  async function shareQuizToInstagramStory(quiz: ShareableQuiz) {
    const url = quizShareUrl(quiz.id, window.location.origin);
    setSharingStoryQuizId(quiz.id);
    setShareStatus("Preparing story card...");

    try {
      const file = await createQuizStoryFile(quiz, url);
      const linkCopied = await navigator.clipboard.writeText(url).then(() => true).catch(() => false);
      const shareData = {
        title: quiz.title,
        text: `Try this astrophotography quiz: ${quiz.title}\n${url}`,
        files: [file],
      };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setShareStatus(linkCopied ? "Story card ready. Quiz link copied for your story sticker." : "Story card ready. Add the quiz link as your story sticker.");
      } else {
        setShareStatus(linkCopied ? "Quiz link copied. Share the story card from a mobile browser to add it to Instagram Stories." : "Share this from a mobile browser to add it to Instagram Stories.");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setShareStatus("Could not prepare Instagram story.");
    } finally {
      setSharingStoryQuizId(null);
      window.setTimeout(() => setShareStatus(""), 3500);
    }
  }

  async function submitQuiz(force = false) {
    if (!activeQuiz) return;
    if (!force && incompleteCount > 0) {
      setShowIncompleteWarning(true);
      return;
    }

    setShowIncompleteWarning(false);
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/astro-quizzes/${activeQuiz.id}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not submit quiz");
      if (res.status === 409) {
        setAnswers({});
        setResult(null);
        fetch(`/api/astro-quizzes/${activeQuiz.id}?t=${Date.now()}`, { cache: "no-store" })
          .then((nextRes) => (nextRes.ok ? nextRes.json() : null))
          .then((data) => {
            if (data) {
              setActiveQuiz(data);
              setCurrentIndex(0);
            }
          })
          .catch(() => undefined);
      }
      return;
    }
    setResult(await res.json());
  }

  if (loading || status === "loading") {
    return <p className="font-mono text-xs text-muted/30">Loading quiz...</p>;
  }

  if (quizzes.length === 0) {
    return (
      <div className="border border-surface/10 bg-surface/[0.02] px-6 py-14 text-center">
        <p className="font-mono text-sm text-muted/35 uppercase tracking-widest">No quizzes published yet.</p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="mx-auto max-w-2xl border border-surface/10 bg-surface/[0.02] px-6 py-12 text-center">
        <h2 className="mt-3 text-2xl font-semibold text-surface">Sign in to complete an astro quiz</h2>
        <button
          type="button"
          onClick={() => NextAuthReact.signIn("google", { callbackUrl: window.location.href })}
          className="mt-6 inline-flex items-center gap-2 border border-accent/40 px-4 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/10"
        >
          <LogIn size={14} />
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {quizzes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className={`flex overflow-hidden border transition-colors ${
              activeQuizId === quiz.id
                ? "border-accent/50 bg-accent/10"
                : "border-surface/10 hover:border-accent/35"
            }`}>
              <button
                type="button"
                onClick={() => setActiveQuizId(quiz.id)}
                className={`px-3 py-2 text-left text-sm transition-colors ${
                activeQuizId === quiz.id
                  ? "text-surface"
                  : "text-muted/55 hover:text-accent"
                }`}
              >
                <span className="block font-medium">{quiz.title}</span>
                <span className="font-mono text-[10px] text-muted/35">{quiz.questionCount} questions</span>
              </button>
              <button
                type="button"
                onClick={() => shareQuiz(quiz)}
                className="border-l border-surface/10 px-2 text-muted/40 transition-colors hover:text-accent"
                aria-label={`Share ${quiz.title}`}
              >
                <Share2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => shareQuizToInstagramStory(quiz)}
                disabled={sharingStoryQuizId === quiz.id}
                className="border-l border-surface/10 px-2 text-muted/40 transition-colors hover:text-accent disabled:opacity-40"
                aria-label={`Add ${quiz.title} to Instagram story`}
              >
                <Camera size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {shareStatus && <p className="font-mono text-xs text-accent">{shareStatus}</p>}

      {error && <p className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      {activeQuiz && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-surface/10 bg-surface/[0.02] px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent/70">Current quiz</p>
            <p className="mt-1 text-sm font-medium text-surface">{activeQuiz.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => shareQuiz(activeQuiz)}
              className="inline-flex items-center gap-2 border border-surface/15 px-3 py-2 font-mono text-xs text-muted/60 transition-colors hover:border-accent/35 hover:text-accent"
            >
              <Share2 size={14} />
              Share
            </button>
            <button
              type="button"
              onClick={() => shareQuizToInstagramStory(activeQuiz)}
              disabled={sharingStoryQuizId === activeQuiz.id}
              className="inline-flex items-center gap-2 border border-surface/15 px-3 py-2 font-mono text-xs text-muted/60 transition-colors hover:border-accent/35 hover:text-accent disabled:opacity-40"
            >
              <Camera size={14} />
              {sharingStoryQuizId === activeQuiz.id ? "Preparing..." : "Instagram story"}
            </button>
          </div>
        </div>
      )}

      {activeQuiz && currentQuestion && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="space-y-4">
            {activeQuiz.imageUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden border border-surface/10 bg-surface/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeQuiz.imageUrl} alt="" className="h-full w-full object-contain" />
                {currentQuestion.marquee && (
                  <div
                    className="absolute border-2 border-accent shadow-[0_0_24px_rgba(56,189,248,0.45)]"
                    style={{
                      left: `${currentQuestion.marquee.x}%`,
                      top: `${currentQuestion.marquee.y}%`,
                      width: `${currentQuestion.marquee.w}%`,
                      height: `${currentQuestion.marquee.h}%`,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center border border-surface/10 bg-surface/[0.02]">
                <p className="font-mono text-xs uppercase tracking-widest text-muted/25">No image attached</p>
              </div>
            )}

            <div className="h-1 bg-surface/10">
              <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="border border-surface/10 bg-surface/[0.02] p-5">
            {result ? (
              <div className="space-y-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Result</p>
                <div>
                  <h2 className="text-2xl font-semibold leading-tight text-surface">{resultHeadline}</h2>
                  <p className="mt-4 text-5xl font-semibold text-surface">{result.score}/{result.total}</p>
                  <RichTextContent html={resultMessage} className="mt-3 text-sm leading-6 text-muted/60" />
                </div>
                <Link
                  href="/astrophotography?tab=sky"
                  className="inline-flex items-center border border-accent/40 px-4 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/10"
                >
                  Open night sky map
                </Link>
                <button
                  type="button"
                  onClick={() => activeQuiz && shareQuiz(activeQuiz)}
                  className="ml-2 inline-flex items-center gap-2 border border-surface/15 px-4 py-2 font-mono text-xs text-muted/60 transition-colors hover:border-accent/35 hover:text-accent"
                >
                  <Share2 size={14} />
                  Share quiz
                </button>
                <button
                  type="button"
                  onClick={() => activeQuiz && shareQuizToInstagramStory(activeQuiz)}
                  disabled={sharingStoryQuizId === activeQuiz.id}
                  className="inline-flex items-center gap-2 border border-surface/15 px-4 py-2 font-mono text-xs text-muted/60 transition-colors hover:border-accent/35 hover:text-accent disabled:opacity-40"
                >
                  <Camera size={14} />
                  {sharingStoryQuizId === activeQuiz.id ? "Preparing..." : "Instagram story"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    Question {currentIndex + 1} / {activeQuiz.questions.length}
                  </p>
                  <p className="font-mono text-[10px] text-muted/35">{answeredCount} answered</p>
                </div>

                <h2 className="mt-4 text-xl font-semibold leading-snug text-surface">{currentQuestion.question}</h2>

                <div className="mt-6 space-y-2">
                  {currentQuestion.options.map((option) => {
                    const selected = answers[String(currentQuestion.id)] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => chooseOption(currentQuestion.id, option.id)}
                        className={`flex w-full items-center gap-3 border px-3 py-3 text-left text-sm transition-colors ${
                          selected
                            ? "border-accent/60 bg-accent/10 text-surface"
                            : "border-surface/10 text-muted/65 hover:border-accent/35 hover:text-surface"
                        }`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center border ${selected ? "border-accent text-accent" : "border-surface/20"}`}>
                          {selected && <Check size={13} />}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                      className="inline-flex items-center gap-2 border border-surface/15 px-3 py-2 font-mono text-xs text-muted/60 transition-colors hover:border-accent/35 hover:text-accent disabled:opacity-30"
                    >
                      <ArrowLeft size={14} />
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentIndex === activeQuiz.questions.length - 1}
                      onClick={() => setCurrentIndex((index) => Math.min(activeQuiz.questions.length - 1, index + 1))}
                      className="inline-flex items-center gap-2 border border-surface/15 px-3 py-2 font-mono text-xs text-muted/60 transition-colors hover:border-accent/35 hover:text-accent disabled:opacity-30"
                    >
                      Next
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => submitQuiz()}
                    className="inline-flex items-center gap-2 border border-accent/40 px-4 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                  >
                    <Send size={14} />
                    {submitting ? "Submitting..." : "Submit quiz"}
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {activeQuiz.questions.map((question, index) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      className={`h-8 w-8 border font-mono text-xs transition-colors ${
                        index === currentIndex
                          ? "border-accent text-accent"
                          : answers[String(question.id)]
                            ? "border-surface/25 text-surface"
                            : "border-surface/10 text-muted/35"
                      }`}
                      aria-label={`Go to question ${index + 1}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showIncompleteWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 px-4 backdrop-blur-sm">
          <div className="max-w-md border border-surface/15 bg-base p-6 shadow-2xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Incomplete quiz</p>
            <h3 className="mt-3 text-xl font-semibold text-surface">Submit with {incompleteCount} unanswered?</h3>
            <p className="mt-3 text-sm leading-6 text-muted/60">
              Unanswered questions will be marked as incorrect, but your quiz can still be submitted.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowIncompleteWarning(false)}
                className="border border-surface/15 px-3 py-2 font-mono text-xs text-muted/60 hover:text-surface"
              >
                Keep answering
              </button>
              <button
                type="button"
                onClick={() => submitQuiz(true)}
                className="border border-accent/40 px-3 py-2 font-mono text-xs text-accent hover:bg-accent/10"
              >
                Submit anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
