import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import classNames from "classnames";

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

function useInView(once = true) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) setVisible(false);
      },
      { rootMargin: "-8% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return { ref, visible };
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = usePrefersReducedMotion();
  const { ref, visible } = useInView(true);

  return (
    <div
      ref={ref}
      className={classNames("reveal", className, { "reveal--on": reduce || visible })}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = usePrefersReducedMotion();
  const { ref, visible } = useInView(true);

  return (
    <div
      ref={ref}
      className={classNames("stagger", className, { "stagger--on": reduce || visible })}
    >
      {children}
    </div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classNames("stagger__item", className)}>{children}</div>;
}
