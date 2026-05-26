import { useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Box, Center, Flex, Heading } from '@chakra-ui/react';
import { ServiceLayout } from '@/components/service_layout';
import { GoogleLoginButton } from '@/components/google_login_button';
import { useAuth } from '@/contexts/auth_user.context';

const IndexPage: NextPage = function () {
  const router = useRouter();
  const { signInWithGoogle, authUser } = useAuth();

  useEffect(() => {
    if (authUser?.email) {
      const screenName = authUser.email.replace('@gmail.com', '');
      if (screenName) router.replace(`/${screenName}`);
    }
  }, [authUser, router]);

  if (authUser) return null;

  return (
    <ServiceLayout title="와글와글" backgroundColor="gray.50" minH="100vh">
      <Box maxW="md" mx="auto" pt="10">
        <img src="/main_logo.svg" alt="로고" />
        <Flex justify="center">
          <Heading>#Waggle Waggle</Heading>
        </Flex>
      </Box>
      <Center mt="20">
        <GoogleLoginButton onClick={signInWithGoogle} />
      </Center>
    </ServiceLayout>
  );
};

export default IndexPage;
