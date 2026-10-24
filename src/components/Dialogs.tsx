'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useI18n } from './I18nProvider';

// Ventanas propias de Training Please en lugar de window.confirm y window.alert:
// - confirm(): diálogo modal con <dialog> (Esc y clic afuera cancelan, el foco queda dentro;
//   si la acción es de peligro, el foco empieza en Cancelar para que un Enter no borre nada).
// - toast(): aviso corto abajo que se va solo.

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // botón de confirmar en rojo (borrar, quitar, revocar)
}

type ToastKind = 'ok' | 'error';
interface Toast { id: number; text: string; kind: ToastKind }

interface Dialogs {
  confirm: (o: ConfirmOptions) => Promise<boolean>;
  toast: (text: string, kind?: ToastKind) => void;
}

const DialogsContext = createContext<Dialogs | null>(null);

export function useDialogs(): Dialogs {
  const ctx = useContext(DialogsContext);
  if (!ctx) throw new Error('useDialogs fuera de DialogsProvider');
  return ctx;
}

const TOAST_MS = 3500;

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const confirm = useCallback((o: ConfirmOptions) => {
    resolver.current?.(false);
    setOpts(o);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  useEffect(() => {
    if (opts && ref.current && !ref.current.open) ref.current.showModal();
  }, [opts]);

  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    ref.current?.close();
    setOpts(null);
  };

  const toast = useCallback((text: string, kind: ToastKind = 'ok') => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), TOAST_MS);
  }, []);

  return (
    <DialogsContext.Provider value={{ confirm, toast }}>
      {children}
      <dialog
        ref={ref}
        className="tp-dialog"
        aria-labelledby="tp-dialog-title"
        onCancel={(e) => { e.preventDefault(); close(false); }}
        onClick={(e) => { if (e.target === ref.current) close(false); }}
      >
        {opts && (
          <div className="tp-dialog-box">
            <h3 id="tp-dialog-title">{opts.title}</h3>
            {opts.message && <p>{opts.message}</p>}
            <div className="actions">
              <button type="button" className="btn small secondary" autoFocus={opts.danger} onClick={() => close(false)}>
                {opts.cancelLabel ?? t.common.cancel}
              </button>
              <button type="button" className={`btn small${opts.danger ? ' danger' : ''}`} autoFocus={!opts.danger} onClick={() => close(true)}>
                {opts.confirmLabel ?? t.common.accept}
              </button>
            </div>
          </div>
        )}
      </dialog>
      <div className="tp-toasts" role="status" aria-live="polite">
        {toasts.map((t) => <p key={t.id} className={`tp-toast ${t.kind}`}>{t.text}</p>)}
      </div>
    </DialogsContext.Provider>
  );
}
