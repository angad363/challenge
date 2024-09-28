import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react';
//import { isDomainAvailable } from '../lib/resources';
import { DomainInfo } from '../types';

interface EditDomainDialogProps {
  isOpen: boolean;
  onClose: () => void;
  domain: DomainInfo;
  onEditDomain: (oldDomain: string, newDomain: string) => void;
}

export const checkDomainAvailability = async (domain: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/checkDomain?domain=${encodeURIComponent(domain)}`);
      if (!response.ok) {
        throw new Error('Failed to check domain availability');
      }
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking domain availability:', error);
      throw error;
    }
  };


export const EditDomainDialog: React.FC<EditDomainDialogProps> = ({
  isOpen,
  onClose,
  domain,
  onEditDomain,
}) => {
  const [editedDomain, setEditedDomain] = useState(domain.name);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleEdit = async () => {
    if (editedDomain === domain.name) {
      onClose();
      return;
    }

    const trimmedDomain = editedDomain.trim().toLowerCase();
    if (!/^[a-z0-9-]+\.(com|xyz|app)$/.test(trimmedDomain)) {
      toast({
        title: "Invalid domain",
        description: "Domain must end with .com, .xyz, or .app",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await checkDomainAvailability(trimmedDomain); // We're not using the result here
      onEditDomain(domain.name, trimmedDomain);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check domain availability",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Domain</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Input
              value={editedDomain}
              onChange={(e) => setEditedDomain(e.target.value)}
              placeholder="Enter a domain name"
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleEdit} isLoading={isLoading}>
            Edit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};