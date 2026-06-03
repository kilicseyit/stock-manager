'use client';

import React, { useEffect } from 'react';
import { useConfirm } from './ConfirmDialog';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: DeleteConfirmDialogProps) {
  const confirm = useConfirm();

  useEffect(() => {
    if (isOpen) {
      confirm({
        title,
        description,
        confirmText: 'Sil',
        cancelText: 'İptal',
        isDestructive: true,
      }).then((confirmed) => {
        if (confirmed) {
          onConfirm();
        } else {
          onClose();
        }
      });
    }
  }, [isOpen, confirm, title, description, onConfirm, onClose]);

  return null;
}
