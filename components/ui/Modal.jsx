'use client';
// ============================================
// components/ui/Modal.jsx
// ============================================
// USAGE:
// const [isOpen, setIsOpen] = useState(false);

// <Modal
//   isOpen={isOpen}
//   onClose={() => setIsOpen(false)}
//   title="Confirm Action"
//   size="md"
//   footer={
//     <>
//       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
//       <Button variant="danger" onClick={handleDelete}>Delete</Button>
//     </>
//   }
// >
//   <p>Are you sure you want to delete this item?</p>
// </Modal>

import { cn } from "@/lib/utils";
import { useEffect } from "react";

// ============================================
// MODAL CONFIGURATION
// ============================================
const modalSizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
};

const Modal = ({
  isOpen,
  onClose,
  size = "md",
  title,
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  overlayClassName = "",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4",
        overlayClassName
      )}
      onClick={() => closeOnOverlayClick && onClose()}
    >
      <div
        className={cn(
          "relative bg-surface rounded-xl shadow-xl max-h-[90vh] overflow-y-auto w-full",
          modalSizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div
            className={cn(
              "flex items-center justify-between px-6 py-4 border-b border-border",
              headerClassName
            )}
          >
            {title && (
              <h3 className='text-xl font-semibold text-text pr-8'>{title}</h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className='absolute top-4 right-4 text-muted hover:text-text transition-colors duration-200 w-6 h-6 flex items-center justify-center rounded hover:bg-muted/20'
                aria-label='Close modal'
              >
                <span className='text-xl leading-none'>×</span>
              </button>
            )}
          </div>
        )}

        <div className={cn("px-6 py-4 text-text", bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              "px-6 py-4 border-t border-border flex justify-end gap-2",
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
