import React, { useState, useCallback } from 'react';
import { Input, Button, HStack, useToast, Spinner } from '@chakra-ui/react';

interface DomainInputProps {
  onAddDomain: (domain: string, available: boolean) => void;
  existingDomains: ReadonlyArray<string>;
}

interface DomainAvailabilityResponse {
  available: boolean;
}

/**
 * DomainInput component
 * Provides an input field for users to enter domain names and add them to the cart
 * 
 * @param {Object} props - Component props
 * @param {(domain: string, available: boolean) => void} props.onAddDomain - Callback function to add a domain to the cart
 * @param {string[]} props.existingDomains - Array of domain names already in the cart
 * @returns {React.ReactElement} The rendered DomainInput component
 */

const checkDomainAvailability = async (domain: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/checkDomain?domain=${domain}`);
    if (!response.ok) {
      throw new Error('Failed to check domain availability');
    }
    const data: DomainAvailabilityResponse = await response.json();
    return data.available;
  } catch (error) {
    console.error('Error checking domain availability:', error);
    throw error;
  }
};

export const DomainInput: React.FC<DomainInputProps> = ({ onAddDomain, existingDomains }) => {
  const [inputDomain, setInputDomain] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const toast = useToast();

  const validateAndAddDomain = useCallback(async (): Promise<void> => {
    const trimmedDomain = inputDomain.trim().toLowerCase();
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

    if (existingDomains.includes(trimmedDomain)) {
      toast({
        title: "Duplicate domain",
        description: "This domain is already in your cart",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsChecking(true);
      const available = await checkDomainAvailability(trimmedDomain);
      onAddDomain(trimmedDomain, available);
      setInputDomain('');
      toast({
        title: "Domain added",
        description: `${trimmedDomain} has been added to your cart (${available ? 'Available' : 'Unavailable'})`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check domain availability",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsChecking(false);
    }
  }, [inputDomain, existingDomains, onAddDomain, toast]);

  return (
    <HStack>
      <Input
        value={inputDomain}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputDomain(e.target.value)}
        placeholder="Enter a domain name"
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' && !isChecking) {
            validateAndAddDomain();
          }
        }}
        isDisabled={isChecking}
      />
      <Button 
        onClick={validateAndAddDomain} 
        isLoading={isChecking}
        loadingText="Checking"
      >
        Add Domain
      </Button>
    </HStack>
  );
};