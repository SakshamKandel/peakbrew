import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SplitText = ({
  text,
  className = "",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
  trigger = "scroll", // "scroll" or "immediate"
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);

  // Custom text splitting function (fallback for premium SplitText)
  const splitTextManually = (element, type) => {
    const text = element.textContent;
    element.innerHTML = '';
    
    if (type === "chars" || type === "characters") {
      return text.split('').map((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space
        span.style.display = 'inline-block';
        span.style.position = 'relative';
        element.appendChild(span);
        return span;
      });
    } else if (type === "words") {
      return text.split(' ').map((word, index) => {
        const span = document.createElement('span');
        span.textContent = word;
        span.style.display = 'inline-block';
        span.style.position = 'relative';
        if (index < text.split(' ').length - 1) {
          span.style.marginRight = '0.25em';
        }
        element.appendChild(span);
        return span;
      });
    }
    return [element];
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || animationCompletedRef.current) return;

    // Use manual splitting instead of GSAP SplitText plugin
    const targets = splitTextManually(el, splitType);

    targets.forEach((t) => {
      t.style.willChange = "transform, opacity";
    });

    const tl = gsap.timeline({
      smoothChildTiming: true,
      onComplete: () => {
        animationCompletedRef.current = true;
        gsap.set(targets, {
          ...to,
          clearProps: "willChange",
          immediateRender: true,
        });
        onLetterAnimationComplete?.();
      },
    });

    if (trigger === "immediate") {
      // Immediate animation for loading screen
      tl.set(targets, { ...from, immediateRender: false, force3D: true });
      tl.to(targets, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        force3D: true,
      });
    } else {
      // Scroll-triggered animation
      const startPct = (1 - threshold) * 100;
      const m = /^(-?\d+)px$/.exec(rootMargin);
      const raw = m ? parseInt(m[1], 10) : 0;
      const sign = raw < 0 ? `-=${Math.abs(raw)}px` : `+=${raw}px`;
      const start = `top ${startPct}%${sign}`;

      tl.scrollTrigger = ScrollTrigger.create({
        trigger: el,
        start,
        toggleActions: "play none none none",
        once: true,
      });

      tl.set(targets, { ...from, immediateRender: false, force3D: true });
      tl.to(targets, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        force3D: true,
      });
    }

    return () => {
      tl.kill();
      if (trigger === "scroll") {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      }
      gsap.killTweensOf(targets);
      // Reset the element
      el.innerHTML = text;
    };
  }, [
    text,
    delay,
    duration,
    ease,
    splitType,
    from,
    to,
    threshold,
    rootMargin,
    onLetterAnimationComplete,
    trigger,
  ]);

  return (
    <p
      ref={ref}
      className={`split-parent ${className}`}
      style={{
        textAlign,
        overflow: "hidden",
        display: "inline-block",
        whiteSpace: "normal",
        wordWrap: "break-word",
      }}
    >
      {text}
    </p>
  );
};

export default SplitText;
