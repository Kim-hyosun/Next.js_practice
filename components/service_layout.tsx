/* eslint-disable react/jsx-props-no-spreading */
import { Box, BoxProps } from '@chakra-ui/react';
import Head from 'next/head';
import GNB from './GNB';

interface Props {
  title: string;
  children: React.ReactNode;
}
//전체적인 layout
export const ServiceLayout: React.FC<Props & BoxProps> = function ({
  title = 'waggle waggle',
  children,
  ...boxProps
}: Props) {
  return (
    <Box {...boxProps}>
      <Head>
        <title>{title}</title>
      </Head>
      <GNB />
      {children}
    </Box>
  );
};
