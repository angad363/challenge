import React, { useState, useCallback, useMemo } from 'react';
import { VStack, Text, useToast } from '@chakra-ui/react';
import { Set } from 'immutable';
import { DomainInput } from './DomainInput';
import { DomainList } from './DomainList';
import { CartFullnessIndicator } from './CartFullnessIndicator';
import { PurchaseButton } from './PurchaseButton';
import { ActionButtons } from './ActionButtons';
import { useConfirmationDialog } from './useConfirmationDialog';
import { DomainInfo } from '../types';
import { checkDomainAvailability } from './EditDomainDialog';

// interface DomainInfo {
//   name: string;
//   available: boolean;
// }

interface DomainShoppingCartProps {
  numDomainsRequired: number;
}

/**
 * DomainShoppingCart component
 * Manages the main functionality of the domain shopping cart, including adding/removing domains,
 * checking cart fullness, and performing actions like purchase, clear, and keep best domains.
 *
 * @param {Object} props - Component props
 * @param {number} props.numDomainsRequired - The number of domains required to complete the purchase
 * @returns {React.ReactElement} The rendered DomainShoppingCart component
 */

export const DomainShoppingCart: React.FC<DomainShoppingCartProps> = ({ numDomainsRequired }) => {
  const [domains, setDomains] = useState<Set<DomainInfo>>(Set());
  const toast = useToast();
  const { openConfirmationDialog, ConfirmationDialogComponent } = useConfirmationDialog();

  /**
 * Adds a new domain to the cart
 *
 * @param {string} domain - The domain name to add
 * @param {boolean} available - Whether the domain is available for purchase
 */

  const handleAddDomain = useCallback((domain: string, available: boolean) => {
    setDomains(prevDomains => {
      const newDomains = prevDomains.add({ name: domain, available });
      if (newDomains.size === numDomainsRequired) {
        toast({
          title: "Cart is full",
          description: `You've added ${numDomainsRequired} domains to your cart.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
      return newDomains;
    });
  }, [numDomainsRequired, toast]);

  const handleRemoveDomain = useCallback((domainName: string) => {
    setDomains(prevDomains => prevDomains.filter(d => d.name !== domainName));
  }, []);

  const canPurchase = useMemo(() => domains.size === numDomainsRequired, [domains.size, numDomainsRequired]);

  const handlePurchase = useCallback(() => {
    console.log('Purchasing domains:', domains.toArray());
    setDomains(Set());
    toast({
      title: "Purchase successful",
      description: "Your payment has been processed.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }, [domains, toast]);

  const clearCart = useCallback(() => {
    openConfirmationDialog(
      "Clear Cart",
      "Are you sure you want to clear your cart? This action cannot be undone.",
      () => {
        setDomains(Set());
        toast({
          title: "Cart cleared",
          description: "All domains have been removed from your cart.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    );
  }, [openConfirmationDialog, toast]);


  const removeUnavailableDomains = useCallback(() => {
    openConfirmationDialog(
      "Remove Unavailable Domains",
      "Are you sure you want to remove all unavailable domains from your cart?",
      () => {
        setDomains(prevDomains => prevDomains.filter(d => d.available));
        toast({
          title: "Unavailable domains removed",
          description: "All unavailable domains have been removed from your cart.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    );
  }, [openConfirmationDialog, toast]);

  const copyDomainsToClipboard = useCallback(() => {
    const domainList = domains.map(d => d.name).join(', ');
    navigator.clipboard.writeText(domainList)
      .then(() => toast({ title: "Copied to clipboard", status: "success" }))
      .catch(() => toast({ title: "Copy failed", status: "error" }));
  }, [domains, toast]);

  /**
 * Sorts the domains in the cart and keeps only the best ones
 * Domains are sorted by TLD priority (.com > .app > .xyz) and then by length (shorter is better)
 * Keeps only the top N domains, where N is numDomainsRequired
 */

  const keepBestDomains = useCallback(() => {
    openConfirmationDialog(
      "Keep Best Domains",
      "Are you sure you want to keep only the best domains? This will remove other domains from your cart.",
      () => {
        const sortedDomains = domains.toArray().sort((a, b) => {
          const getScore = (domain: string) => domain.endsWith('.com') ? 3 : domain.endsWith('.app') ? 2 : 1;
          const scoreA = getScore(a.name), scoreB = getScore(b.name);
          return scoreB - scoreA || a.name.length - b.name.length;
        });
        setDomains(Set(sortedDomains.slice(0, numDomainsRequired)));
        toast({
          title: "Best domains kept",
          description: "Your cart has been updated with the best domains.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    );
  }, [domains, numDomainsRequired, openConfirmationDialog, toast]);

  const handleEditDomain = useCallback(async (oldDomain: string, newDomain: string) => {
    try {
      const available = await checkDomainAvailability(newDomain);
      setDomains(prevDomains => {
        const domainToEdit = prevDomains.find(d => d.name === oldDomain);
        if (!domainToEdit) return prevDomains;

        const updatedDomain = { name: newDomain, available };
        return prevDomains.delete(domainToEdit).add(updatedDomain);
      });
      toast({
        title: "Domain updated",
        description: `${newDomain} has been updated in your cart (${available ? 'Available' : 'Unavailable'})`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating domain:', error);
      toast({
        title: "Error",
        description: "Failed to update domain",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [setDomains, toast]);

  return (
    <VStack spacing={4} align="stretch">
      <Text>Max Domains: {numDomainsRequired}</Text>
      <DomainInput
        onAddDomain={handleAddDomain}
        existingDomains={domains.map(d => d.name).toArray()}
      />
      <DomainList
        domains={domains.toArray()}
        onRemoveDomain={handleRemoveDomain}
        onEditDomain={handleEditDomain}
      />
      <CartFullnessIndicator currentSize={domains.size} requiredSize={numDomainsRequired} />
      <PurchaseButton canPurchase={canPurchase} onPurchase={handlePurchase} />
      <ActionButtons
        onClearCart={clearCart}
        onRemoveUnavailable={removeUnavailableDomains}
        onCopyToClipboard={copyDomainsToClipboard}
        onKeepBest={keepBestDomains}
      />
      <ConfirmationDialogComponent />
    </VStack>
  );
};