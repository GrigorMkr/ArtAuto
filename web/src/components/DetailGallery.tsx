import { memo, useEffect, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { CarPhoto } from "./CarPhoto";
import { mediaUrl } from "../api";

type Props = {
  photos: string[];
  alt: string;
  active: number;
  onChange: (index: number) => void;
};

export const DetailGallery = memo(function DetailGallery({ photos, alt, active, onChange }: Props) {
  const [lightbox, setLightbox] = useState(false);
  const touchX = useRef<number | null>(null);
  const scrubbing = useRef(false);
  const list = photos.length ? photos : [];
  const current = list[active] || list[0];

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") onChange((active + 1) % list.length);
      if (e.key === "ArrowLeft") onChange((active - 1 + list.length) % list.length);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox, active, list.length, onChange]);

  function step(delta: number) {
    if (list.length < 2) return;
    onChange((active + delta + list.length) % list.length);
  }

  function onScrub(e: MouseEvent<HTMLDivElement>) {
    if (list.length < 2 || !scrubbing.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(0.999, Math.max(0, (e.clientX - rect.left) / rect.width));
    onChange(Math.min(list.length - 1, Math.floor(ratio * list.length)));
  }

  function onTouchStart(e: TouchEvent) {
    touchX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: TouchEvent) {
    if (touchX.current == null || list.length < 2) return;
    const x = e.changedTouches[0]?.clientX ?? touchX.current;
    const dx = x - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    step(dx < 0 ? 1 : -1);
  }

  if (!current) {
    return (
      <div className="detail-gallery">
        <div className="vehicle-card__placeholder detail-hero large">{alt}</div>
      </div>
    );
  }

  const lightboxNode = lightbox
    ? createPortal(
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фото"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            className="lightbox__close"
            aria-label="Закрыть"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(false);
            }}
          >
            ×
          </button>
          {list.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                aria-label="Предыдущее"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--next"
                aria-label="Следующее"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
              >
                ›
              </button>
            </>
          )}
          <div className="lightbox__frame" onClick={(e) => e.stopPropagation()}>
            <img
              className="lightbox__img"
              src={mediaUrl(current)}
              alt={alt}
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="lightbox__meta" onClick={(e) => e.stopPropagation()}>
            {active + 1} / {list.length} · клик вне фото — закрыть
          </p>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="detail-gallery">
      <div
        className={classNames("detail-gallery__stage", {
          "detail-gallery__stage--multi": list.length > 1,
        })}
        onMouseDown={() => {
          scrubbing.current = true;
        }}
        onMouseUp={() => {
          scrubbing.current = false;
        }}
        onMouseLeave={() => {
          scrubbing.current = false;
        }}
        onMouseMove={onScrub}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          className="detail-gallery__open"
          onClick={() => setLightbox(true)}
          aria-label="Открыть фото"
        >
          <CarPhoto className="detail-hero" src={current} alt={alt} eager />
        </button>
        {list.length > 1 && (
          <>
            <span className="detail-gallery__count">
              {active + 1} / {list.length}
            </span>
            <button
              type="button"
              className="detail-gallery__nav detail-gallery__nav--prev"
              aria-label="Предыдущее фото"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
            >
              ‹
            </button>
            <button
              type="button"
              className="detail-gallery__nav detail-gallery__nav--next"
              aria-label="Следующее фото"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {list.length > 1 && (
        <div className="thumbs" role="listbox" aria-label="Фотографии автомобиля">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={classNames("thumbs__item", { "thumbs__item--active": i === active })}
              onClick={() => onChange(i)}
              aria-label={`Фото ${i + 1}`}
              aria-selected={i === active}
            >
              <CarPhoto src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      {lightboxNode}
    </div>
  );
});
