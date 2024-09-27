import React from 'react';
import { Button, HStack } from '@chakra-ui/react';

/**
 * ActionButtons component
 * Renders a set of action buttons for managing the domain shopping cart.
 * 
 * @param {Object} props - Component props
 * @param {() => void} props.onClearCart - Callback function to clear all domains from the cart
 * @param {() => void} props.onRemoveUnavailable - Callback function to remove unavailable domains from the cart
 * @param {() => void} props.onCopyToClipboard - Callback function to copy all domain names to the clipboard
 * @param {() => void} props.onKeepBest - Callback function to keep only the best domains in the cart
 * @returns {React.ReactElement} The rendered ActionButtons component
 */

interface ActionButtonsProps {
  onClearCart: () => void;
  onRemoveUnavailable: () => void;
  onCopyToClipboard: () => void;
  onKeepBest: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onClearCart,
  onRemoveUnavailable,
  onCopyToClipboard,
  onKeepBest
}) => (
  <HStack spacing={2} wrap="wrap" justify="center">
    <Button onClick={onClearCart}>Clear Cart</Button>
    <Button onClick={onRemoveUnavailable}>Remove Unavailable</Button>
    <Button onClick={onCopyToClipboard}>Copy to Clipboard</Button>
    <Button onClick={onKeepBest}>Keep Best Domains</Button>
  </HStack>
);