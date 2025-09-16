import { client } from "../sanity/lib/client";

/**
 * Fetches filter options (bonus types, bookmakers, advanced options) for a given country.
 * @param {string} countryName
 * @returns {Promise<{bonusTypeOptions: Array, bookmakerOptions: Array, advancedOptions: Array}>}
 */
export async function getFilterOptionsForCountry(countryName) {
  // Fetch bonus types
  const bonusTypeQuery = `*[_type == "bonusType"]{ _id, name } | order(name asc)`;
  const bonusTypeOptions = await client.fetch(bonusTypeQuery);

  // Fetch bookmakers for this country
  const bookmakerQuery = `*[_type == "bookmaker" && country->country == $countryName]{ _id, name, logo, logoAlt } | order(name asc)`;
  const bookmakerOptions = await client.fetch(bookmakerQuery, { countryName });

  // Fetch advanced options (example: payment methods and licenses)
  const paymentMethodsQuery = `*[_type == "paymentMethod"]{ _id, name } | order(name asc)`;
  const paymentMethods = await client.fetch(paymentMethodsQuery);

  const licenseQuery = `*[_type == "license"]{ _id, name } | order(name asc)`;
  const licenses = await client.fetch(licenseQuery);

  // Advanced options structure: [{ name: 'Payment Methods', subcategories: [...] }, ...]
  const advancedOptions = [
    {
      name: "Payment Methods",
      subcategories: paymentMethods,
    },
    {
      name: "Licenses",
      subcategories: licenses,
    },
  ];

  return {
    bonusTypeOptions,
    bookmakerOptions,
    advancedOptions,
  };
}
