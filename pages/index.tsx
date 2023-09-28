import { NextPage } from 'next';
import { Box, Center, Flex, Heading } from '@chakra-ui/react';
import { ServiceLayout } from '@/components/service_layout';
import { GoogleLoginButton } from '@/components/google_login_button';

const IndexPage: NextPage = function () {
  return (
    <ServiceLayout title="와글와글">
      <Box maxW="md" mx="auto">
        <img src="/main_logo.svg" alt="로고" />
        <Flex justify="center">
          <Heading>#Waggle Waggle</Heading>
        </Flex>
      </Box>
      <Center mt="20">
        <GoogleLoginButton />
      </Center>
    </ServiceLayout>
  );
};

export default IndexPage;
