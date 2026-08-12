import HomeClient from './HomeClient';

export const metadata = {
  alternates: {
    canonical: '/',
  },
};

export default function Home() {
  return <HomeClient />;
}
