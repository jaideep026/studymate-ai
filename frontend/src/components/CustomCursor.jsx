import { useEffect, useRef, useState } from "react";

// A cursor-follow icon showing the study tool currently "in your hand" —
// pencil, highlighter, pen, marker — cycling every few seconds. It's a
// themed replacement for a plain dot: it never intercepts clicks
// (pointer-events: none) and is disabled entirely on touch devices.
const TOOLS = [
  {
    name: "pencil",
    svg: (
      <>
        <path d="M2 22l1.2-5.4L14.6 5.2a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L7.4 20.8 2 22z" />
        <path d="M13 7l4 4" />
      </>
    ),
  },
  {
    name: "highlighter",
    svg: (
      <>
        <path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" />
        <path d="M14 6l4 4" />
        <path d="M17 3l4 4-2 2-4-4z" />
      </>
    ),
  },
  {
    name: "pen",
    svg: (
      <>
        <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
        <path d="M14 7l3 3" />
        <circle cx="19" cy="5" r="1.4" />
      </>
    ),
  },
  {
    name: "marker",
    svg: (
      <>
        <rect x="14" y="3" width="5" height="8" rx="1" transform="rotate(45 16.5 7)" />
        <path d="M12.5 9.5l-9 9-1 3 3-1 9-9z" />
      </>
    ),
  },
];

export default function CustomCursor() {
  const wrapRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [toolIndex, setToolIndex] = useState(0);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch) return;
    setEnabled(true);

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let curX = x;
    let curY = y;

    function onMove(e) {
      x = e.clientX;
      y = e.clientY;
    }
    function onDown() {
      setClicking(true);
      setTimeout(() => setClicking(false), 220);
    }

    let frame;
    function tick() {
      curX += (x - curX) * 0.25;
      curY += (y - curY) * 0.25;
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate(${curX}px, ${curY}px) rotate(-45deg)`;
      }
      frame = requestAnimationFrame(tick);
    }

    const cycle = setInterval(() => {
      setToolIndex((i) => (i + 1) % TOOLS.length);
    }, 3400);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    tick();
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      cancelAnimationFrame(frame);
      clearInterval(cycle);
    };
  }, []);

  if (!enabled) return null;

  const tool = TOOLS[toolIndex];

  return (
    <div ref={wrapRef} className="study-cursor" data-tool={tool.name}>
      <svg
        className={`study-cursor-icon${clicking ? " study-cursor-click" : ""}`}
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        key={tool.name}
      >
        {tool.svg}
      </svg>
    </div>
  );
}
