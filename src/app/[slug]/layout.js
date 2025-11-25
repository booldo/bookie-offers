import { CountryProvider } from '../../hooks/useCountryContext';

export default function CountryLayout({ children }) {
  return (
    <>
    <CountryProvider>
      {children}
    </CountryProvider>
     </>
  );
}