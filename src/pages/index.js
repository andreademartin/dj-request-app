import Head from 'next/head';
import dynamic from 'next/dynamic';

const SongRequestApp = dynamic(() => import('../components/SongRequestApp'), { 
  ssr: false 
});

export default function Home() {
  return (
    <>
      <Head>
        <title>Peppone&apos;s Hits on Demand</title>
        <meta name="description" content="Richiedi le tue canzoni preferite" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <SongRequestApp />
      </main>
    </>
  );
}
