import Head from 'next/head';

interface Props {
  title: string;
  children: React.ReactNode;
}
//전체적인 layout
export const ServiceLayout = function ({ title = 'waggle waggle', children }: Props) {
  return (
    <div>
      <Head>
        <title>{title}</title>
      </Head>
      {children}
    </div>
  );
};
