import React from 'react';
import { VStack, HStack, Text, Button, Badge } from '@chakra-ui/react';

/**
 * Represents information about a domain in the cart.
 */
interface DomainInfo {
  name: string;
  available: boolean;
}

/**
 * Props for the DomainList component.
 */
interface DomainListProps {
  domains: DomainInfo[];
  onRemoveDomain: (domain: string) => void;
}

/**
 * DomainList component
 * Displays a list of domains in the shopping cart, showing their availability status
 * and providing an option to remove each domain.
 * 
 * @param {Object} props - Component props
 * @param {DomainInfo[]} props.domains - Array of domain objects in the cart
 * @param {(domain: string) => void} props.onRemoveDomain - Callback function to remove a domain from the cart
 * @returns {React.ReactElement} The rendered DomainList component
 */
export const DomainList: React.FC<DomainListProps> = ({ domains, onRemoveDomain }) => {
  if (domains.length === 0) {
    return <Text>No domains in cart. Add some domains above!</Text>;
  }

  return (
    <VStack align="stretch" spacing={2}>
      {domains.map((domain) => (
        <HStack key={domain.name} justifyContent="space-between">
          <Text>{domain.name}</Text>
          <HStack>
            <Badge colorScheme={domain.available ? "green" : "red"}>
              {domain.available ? "Available" : "Unavailable"}
            </Badge>
            <Button size="sm" onClick={() => onRemoveDomain(domain.name)}>
              Remove
            </Button>
          </HStack>
        </HStack>
      ))}
    </VStack>
  );
};