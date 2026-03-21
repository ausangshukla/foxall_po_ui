import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  variant?: 'danger' | 'primary' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="py-2">
          {message}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        {showCancel && (
          <Button 
            variant="light" 
            onClick={onCancel} 
            disabled={isLoading}
            className="px-4"
          >
            {cancelText}
          </Button>
        )}
        <Button 
          variant={variant} 
          onClick={onConfirm} 
          disabled={isLoading}
          className="px-4 d-flex align-items-center gap-2"
        >
          {isLoading && (
            <span 
              className="spinner-border spinner-border-sm" 
              role="status" 
              aria-hidden="true"
            ></span>
          )}
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
