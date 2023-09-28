import { NextPage } from 'next';
import { Box, Center, Flex, Heading } from '@chakra-ui/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ServiceLayout } from '@/components/service_layout';
import { GoogleLoginButton } from '@/components/google_login_button';
import FirebaseClient from '@/models/firebase_client';

const provider = new GoogleAuthProvider();
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
        <GoogleLoginButton
          onClick={() => {
            signInWithPopup(FirebaseClient.getInstance().Auth, provider)
              .then((res) => {
                console.info(res.user);
              })
              .catch((err) => console.error(err));
          }}
        />
      </Center>
    </ServiceLayout>
  );
};

export default IndexPage;
