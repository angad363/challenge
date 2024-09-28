import React from 'react';
import { VStack, HStack, Text, IconButton, Badge, Box, useDisclosure } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useConfirmationDialog } from './useConfirmationDialog';
import { EditDomainDialog } from './EditDomainDialog';
import { DomainInfo } from '../types';

interface DomainListProps {
  domains: DomainInfo[];
  onRemoveDomain: (domain: string) => void;
  onEditDomain: (oldDomain: string, newDomain: string) => void;
}

export const DomainList: React.FC<DomainListProps> = ({ domains, onRemoveDomain, onEditDomain }) => {
  const { openConfirmationDialog, ConfirmationDialogComponent } = useConfirmationDialog();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingDomain, setEditingDomain] = React.useState<DomainInfo | null>(null);

  const handleRemoveDomain = (domainName: string) => {
    openConfirmationDialog(
      "Remove Domain",
      `Are you sure you want to remove ${domainName} from your cart?`,
      () => onRemoveDomain(domainName)
    );
  };

  const handleEditDomain = (domain: DomainInfo) => {
    setEditingDomain(domain);
    onOpen();
  };

  if (domains.length === 0) {
    return <Text>No domains in cart. Add some domains above!</Text>;
  }

  return (
    <VStack align="stretch" spacing={2}>
      {domains.map((domain) => (
        <Box key={domain.name} borderWidth="1px" borderRadius="lg" p={3}>
          <HStack justifyContent="space-between">
            <Text>{domain.name}</Text>
            <HStack>
              <Badge colorScheme={domain.available ? "green" : "red"}>
                {domain.available ? "Available" : "Unavailable"}
              </Badge>
              <IconButton
                aria-label="Edit domain"
                icon={<EditIcon />}
                size="sm"
                onClick={() => handleEditDomain(domain)}
              />
              <IconButton
                aria-label="Remove domain"
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                onClick={() => handleRemoveDomain(domain.name)}
              />
            </HStack>
          </HStack>
        </Box>
      ))}
      <ConfirmationDialogComponent />
      {editingDomain && (
      <EditDomainDialog
        isOpen={isOpen}
        onClose={() => {
          setEditingDomain(null);
          onClose();
        }}
        domain={editingDomain}
        onEditDomain={onEditDomain}
      />
      )}
    </VStack>
  );
};