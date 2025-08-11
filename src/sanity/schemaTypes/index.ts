import { type SchemaTypeDefinition } from 'sanity'
import bookmaker from './bookmaker'
import bonusType from './bonusType'
import offers from './offers'
import article from "./article";
import banner from "./banner";
import faq from "./faq";
import seoSettings from "./seoSettings";
import clickTracking from "./clickTracking";
import comparison from "./comparison";
import affiliate from "./affiliate";
import about from "./about";
import contact from "./contact";
import countryPage from "./countryPage";

export const schemaTypes = [
  bookmaker,
  bonusType,
  offers,
  article,
  banner,
  faq,
  seoSettings,
  clickTracking,
  comparison,
  affiliate,
  about,
  contact,
  countryPage,
  codeInput,
];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: schemaTypes,
};
