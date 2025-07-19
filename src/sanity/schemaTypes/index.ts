import { type SchemaTypeDefinition } from 'sanity'
import offer from './offer'
import faq from './faq'
import banner from './banner'

export const schemaTypes = [
  offer,
  faq,
  banner,
];

export const schema: { types: SchemaTypeDefinition[] } = {
  types: schemaTypes,
};
