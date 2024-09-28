import React, { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>
            {message}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={onConfirm} ml={3}>
              Yes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export const useConfirmationDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const onClose = useCallback(() => setIsOpen(false), []);

  const openConfirmationDialog = useCallback(
    (title: string, message: string, onConfirm: () => void) => {
      setDialogConfig({ title, message, onConfirm });
      setIsOpen(true);
    },
    []
  );

  const ConfirmationDialogComponent = useCallback(
    () => (
      <ConfirmationDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => {
          dialogConfig.onConfirm();
          onClose();
        }}
        title={dialogConfig.title}
        message={dialogConfig.message}
      />
    ),
    [isOpen, onClose, dialogConfig]
  );

  return { openConfirmationDialog, ConfirmationDialogComponent };
};