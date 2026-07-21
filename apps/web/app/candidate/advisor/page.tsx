"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, RotateCcw, Send } from "lucide-react";
import { askAdvisor, suggestedQuestions, type ChatMessage } from "@/lib/candidate";

const GREETING: ChatMessage = {
  id: "g0",
  who: "ai",
  text: "Hello, Alexander. I'm your personal career advisor. I've analyzed your profile and experience to help you find the ideal role. What would you like to explore today?",
  time: "9:41 AM",
};

export default function AdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send(question: string) {
    if (!question.trim() || thinking) return;
    setStarted(true);
    setMessages((prev) => [...prev, { id: `m${Date.now()}`, who: "me", text: question, time: "Just now" }]);
    setInput("");
    setThinking(true);
    const reply = await askAdvisor(question);
    setThinking(false);
    setMessages((prev) => [...prev, { id: `a${Date.now()}`, who: "ai", text: reply, time: "Just now" }]);
  }

  function reset() {
    setMessages([{ id: "g1", who: "ai", text: "Chat reset. What would you like to explore next, Alexander?", time: "Just now" }]);
    setStarted(false);
  }

  return (
    <div className="max-w-[760px] mx-auto flex flex-col h-[calc(100vh-56px)]">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-surface2 border border-gold/30 flex items-center justify-center">
            <Sparkles size={20} className="text-gold" />
            <span className="absolute bottom-[1px] right-[1px] w-[10px] h-[10px] rounded-full bg-ok border-2 border-bg" />
          </div>
          <div>
            <h1 className="font-serif text-[21px] font-bold text-ink">Career Advisor</h1>
            <div className="font-mono text-[9.5px] tracking-wider text-ok uppercase mt-[3px]">Online · AI-Powered</div>
          </div>
        </div>
        <button onClick={reset} className="w-11 h-11 rounded-full bg-surface2 border border-line flex items-center justify-center text-dim hover:text-ink">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* preference banner */}
      <div className="flex justify-between items-center gap-3 bg-surface2 border border-line rounded-2xl px-4 py-4 mt-5">
        <div>
          <div className="eyebrow">Your Job Preferences</div>
          <div className="text-ink text-[14px] mt-2">Senior PM · Fintech · $180K – $230K · Hybrid</div>
        </div>
        <span className="font-mono text-[10px] font-bold text-ok bg-ok/[0.14] border border-ok/35 rounded-lg px-[10px] py-[5px]">94% FIT</span>
      </div>

      {/* chat */}
      <div className="flex-1 overflow-y-auto mt-5 flex flex-col gap-4 pr-1">
        {messages.map((m) =>
          m.who === "me" ? (
            <div key={m.id} className="self-end max-w-[84%] rounded-2xl rounded-tr-md px-4 py-3" style={{ backgroundColor: "#cda14a" }}>
              <p className="text-[14px] leading-5 font-medium" style={{ color: "#2b2106" }}>{m.text}</p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-[9px] items-start self-start max-w-[88%]">
              <div className="w-[26px] h-[26px] rounded-full bg-surface2 border border-gold/25 flex items-center justify-center mt-[2px] shrink-0">
                <Sparkles size={13} className="text-gold" />
              </div>
              <div>
                <div className="bg-surface2 border border-line rounded-2xl rounded-tl-md px-4 py-3">
                  <p className="text-ink text-[14px] leading-[21px]">{m.text}</p>
                </div>
                <div className="font-mono text-[10px] text-mut mt-[5px]">{m.time}</div>
              </div>
            </div>
          ),
        )}

        {thinking && (
          <div className="flex gap-[9px] items-center self-start text-mut text-[13px]">
            <div className="w-[26px] h-[26px] rounded-full bg-surface2 border border-gold/25 flex items-center justify-center"><Sparkles size={13} className="text-gold" /></div>
            <span className="animate-pulse">Thinking…</span>
          </div>
        )}

        {!started && (
          <div className="mt-2">
            <div className="eyebrow mb-3">Suggested Questions</div>
            <div className="flex flex-wrap gap-[10px]">
              {suggestedQuestions.map((qq) => (
                <button key={qq} onClick={() => send(qq)} className="rounded-xl px-[15px] py-[10px] text-goldbright text-[13px]" style={{ backgroundColor: "rgba(216,180,90,0.08)", border: "1px solid rgba(216,180,90,0.28)" }}>
                  {qq}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* input */}
      <div className="flex items-center gap-3 bg-surface2 border border-line rounded-2xl pl-5 pr-3 py-[10px] mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Ask about your job preferences…"
          className="flex-1 bg-transparent outline-none text-ink text-[14px] placeholder:text-mut"
        />
        <button onClick={() => send(input)} className="w-10 h-10 rounded-xl bg-surface3 border border-line2 flex items-center justify-center text-gold">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
