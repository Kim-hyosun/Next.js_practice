import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

interface Props {
  label?: string;
}

export default function FullPageSpinner({ label = '잠시만 기다려주세요...' }: Props) {
  return (
    <Center minH="100vh" bg="gray.50">
      <VStack spacing="4">
        <Spinner size="xl" color="pink.400" thickness="4px" speed="0.65s" />
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
      </VStack>
    </Center>
  );
}
