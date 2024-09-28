import React from 'react';
import { Box, Text, VStack } from "@chakra-ui/react";
import { DomainShoppingCart } from './DomainShoppingCart';

export interface ChallengeProps {
  maxDomains: number;
}

export function Challenge(props: ChallengeProps) {
  const { maxDomains } = props;

  return (
    <Box
      maxWidth="600px"
      margin="auto"
      padding={6}
      borderRadius="lg"
      boxShadow="lg"
      background="linear-gradient(to bottom right, #E6F0FF, #FFFFFF)"
    >
      <VStack spacing={6}>
        <Text
          fontSize="3xl"
          fontWeight="bold"
          textAlign="center"
          color="blue.600"
        >
          Domain Shopping Cart
        </Text>
        <Box
          width="100%"
          borderWidth={1}
          borderRadius="md"
          p={4}
          backgroundColor="white"
        >
          <DomainShoppingCart numDomainsRequired={maxDomains} />
        </Box>
      </VStack>
    </Box>
  );
}