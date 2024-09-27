import React from 'react';
import { Text, Progress } from '@chakra-ui/react';

interface CartFullnessIndicatorProps {
  currentSize: number;
  requiredSize: number;
}

/**
 * CartFullnessIndicator component
 * Displays a progress bar indicating how full the shopping cart is relative to the required number of domains.
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentSize - The current number of domains in the cart
 * @param {number} props.requiredSize - The required number of domains to complete the purchase
 * @returns {React.ReactElement} The rendered CartFullnessIndicator component
 */

export const CartFullnessIndicator: React.FC<CartFullnessIndicatorProps> = ({ currentSize, requiredSize }) => {

  /**
   * Calculates the percentage of cart fullness
   * @type {number}
   */  
  const cartFullness = (currentSize / requiredSize) * 100;

  return (
    <>
      <Text>Cart Fullness:</Text>
      <Progress value={cartFullness} colorScheme={cartFullness > 100 ? "red" : "green"} />
    </>
  );
};