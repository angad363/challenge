import React, { useState, useCallback, useMemo } from 'react';
import { VStack, Text, useToast } from '@chakra-ui/react';
import { Set } from 'immutable';
import { DomainInput } from './DomainInput';
import { DomainList } from './DomainList';
import { CartFullnessIndicator } from './CartFullnessIndicator';
import { PurchaseButton } from './PurchaseButton';
import { ActionButtons } from './ActionButtons';

interface DomainInfo {
  name: string;
  available: boolean;
}

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

  /**
 * Adds a new domain to the cart
 * 
 * @param {string} domain - The domain name to add
 * @param {boolean} available - Whether the domain is available for purchase
 */

  const handleAddDomain = useCallback((domain: string, available: boolean) => {
    setDomains(prevDomains => prevDomains.add({ name: domain, available }));
  }, []);

  const handleRemoveDomain = useCallback((domainName: string) => {
    setDomains(prevDomains => prevDomains.filter(d => d.name !== domainName));
  }, []);

  const canPurchase = useMemo(() => domains.size === numDomainsRequired, [domains.size, numDomainsRequired]);

  const handlePurchase = useCallback(() => {
    console.log('Purchasing domains:', domains.toArray());
    setDomains(Set());
  }, [domains]);

  const clearCart = useCallback(() => setDomains(Set()), []);

  const removeUnavailableDomains = useCallback(() => {
    setDomains(prevDomains => prevDomains.filter(d => d.available));
  }, []);

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
    const sortedDomains = domains.toArray().sort((a, b) => {
      const getScore = (domain: string) => domain.endsWith('.com') ? 3 : domain.endsWith('.app') ? 2 : 1;
      const scoreA = getScore(a.name), scoreB = getScore(b.name);
      return scoreB - scoreA || a.name.length - b.name.length;
    });
    setDomains(Set(sortedDomains.slice(0, numDomainsRequired)));
  }, [domains, numDomainsRequired]);

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
      />
      <CartFullnessIndicator currentSize={domains.size} requiredSize={numDomainsRequired} />
      <PurchaseButton canPurchase={canPurchase} onPurchase={handlePurchase} />
      <ActionButtons 
        onClearCart={clearCart}
        onRemoveUnavailable={removeUnavailableDomains}
        onCopyToClipboard={copyDomainsToClipboard}
        onKeepBest={keepBestDomains}
      />
    </VStack>
  );
};