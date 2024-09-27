import React from 'react';
import { Button } from '@chakra-ui/react';

interface PurchaseButtonProps {
  canPurchase: boolean;
  onPurchase: () => void;
}

/**
 * PurchaseButton component
 * Renders a button that allows users to purchase domains when the cart meets the required conditions.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.canPurchase - Indicates whether the purchase can be made (e.g., correct number of domains in cart)
 * @param {() => void} props.onPurchase - Callback function to be called when the purchase button is clicked
 * @returns {React.ReactElement} The rendered PurchaseButton component
 */

export const PurchaseButton: React.FC<PurchaseButtonProps> = ({ canPurchase, onPurchase }) => (
  <Button 
    onClick={onPurchase} 
    isDisabled={!canPurchase}
    colorScheme="blue"
  >
    Purchase Domains
  </Button>
);