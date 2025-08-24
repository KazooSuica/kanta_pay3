import React, { useEffect, useRef } from 'react'
import Modal from './Modal'
import Alert from './Alert'
import Button from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel
}) => {
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messageRef.current?.focus()
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="確認" size="sm">
      <Alert variant="warning" className="mb-4">
        <div tabIndex={-1} ref={messageRef}>{message}</div>
      </Alert>
      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          OK
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
