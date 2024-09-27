import React from 'react';
import { Box, Text } from "@chakra-ui/react";
import { DomainShoppingCart } from './DomainShoppingCart';

/**
 * Props for the Challenge component.
 */
export interface ChallengeProps {
  /**
   * The maximum number of domains the user is allowed to have
   * in their cart. Invalid domains count toward this limit as well.
   */
  maxDomains: number;
}

/**
 * Challenge component
 * The main component for the domain shopping cart challenge.
 * It wraps the DomainShoppingCart component and provides a title.
 * @param {Object} props - Component props
 * @param {number} props.maxDomains - The maximum number of domains allowed in the cart
 * @returns {React.ReactElement} The rendered Challenge component
 */
export function Challenge(props: ChallengeProps) {
  const { maxDomains } = props;

  return (
    <Box maxWidth="600px" margin="auto" padding={4}>
      <Text fontSize="2xl" mb={4}>Domain Shopping Cart</Text>
      <DomainShoppingCart numDomainsRequired={maxDomains} />
    </Box>
  );
}