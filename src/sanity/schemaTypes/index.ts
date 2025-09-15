import { type SchemaTypeDefinition } from 'sanity'
import bookmaker from './bookmaker'
import bonusType from './bonusType'
import offers from './offers'
import article from "./article";
import banner from "./banner";
import faq from "./faq";
import landingPage from "./landingPage";
import affiliate from "./affiliate";
import countryPage from "./countryPage";
import codeBlock from "./codeBlock";
import hamburgerMenu from "./hamburgerMenu";
import footer from "./footer";
import licenses from "./licenses";
import paymentOptions from "./paymentOptions";
import calculator from "./calculator";
import redirects from "./redirects";

export const schemaTypes = [
  bookmaker,
  bonusType,
  offers,
  article,
  banner,
  faq,
  landingPage,
  affiliate,
  countryPage,
  codeBlock,
  hamburgerMenu,
  footer,
  licenses,
  paymentOptions,
  calculator,
  redirects,
];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: schemaTypes,
};
