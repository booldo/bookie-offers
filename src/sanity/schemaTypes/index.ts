import { type SchemaTypeDefinition } from 'sanity'
import bookmaker from './bookmaker'
import bonusType from './bonusType'
import article from "./article";
import banner from "./banner";
import faq from "./faq";
import seoSettings from "./seoSettings";
import clickTracking from "./clickTracking";
import comparison from "./comparison";

export const schemaTypes = [
  bookmaker,
  bonusType,
  article,
  banner,
  faq,
  seoSettings,
  clickTracking,
  comparison,
];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: schemaTypes,
};
