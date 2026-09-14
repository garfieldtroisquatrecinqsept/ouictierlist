interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={busy ? undefined : onCancel}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="ghost" disabled={busy} onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="danger" disabled={busy} onClick={onConfirm}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Suppression…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
