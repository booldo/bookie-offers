import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Dynamic Countries Section
      S.listItem()
        .title('Countries')
        .child(
          S.documentTypeList('countryPage')
            .title('Countries')
            .child((countryId) =>
          S.list()
                .title('Country Management')
            .items([
                  // Country Settings
                  S.listItem()
                    .title('Add Country')
                    .child(
                      S.document()
                        .documentId(countryId)
                        .schemaType('countryPage')
                    ),
                  
                  S.divider(),
                  
                  // Bookmakers
              S.listItem()
                .title('Bookmakers')
                .child(
                  S.documentList()
                        .title('Bookmakers')
                        .filter('_type == "bookmaker" && country._ref == $countryId')
                        .params({countryId})
                    ),
                  
                  // Offers
              S.listItem()
                .title('Offers')
                .child(
                  S.documentList()
                        .title('Offers')
                        .filter('_type == "offers" && bookmaker->country._ref == $countryId')
                        .params({countryId})
                    ),
                  
                  // Bonus Types
              S.listItem()
                .title('Bonus Types')
                .child(
                  S.documentList()
                        .title('Bonus Types')
                        .filter('_type == "bonusType" && country._ref == $countryId')
                        .params({countryId})
                    ),
                  
                  // Homepage Banners
              S.listItem()
                .title('Homepage Banners')
                .child(
                  S.documentList()
                        .title('Homepage Banners')
                        .filter('_type == "banner" && country._ref == $countryId')
                        .params({countryId})
                ),
                  
                  // Homepage Content
              S.listItem()
                .title('Homepage Content')
                .child(
                  S.documentList()
                        .title('Homepage Content')
                        .filter('_type == "comparison" && country._ref == $countryId')
                        .params({countryId})
                ),
                  
                  // Pretty Links
              S.listItem()
                .title('Pretty Links')
                .child(
                  S.documentList()
                        .title('Pretty Links')
                        .filter('_type == "affiliate" && bookmaker->country._ref == $countryId')
                        .params({countryId})
                ),
            ])
            )
        ),

      // Content Management Section
      S.listItem()
        .title('Content Management')
        .child(
          S.list()
            .title('Content Management')
            .items([
              S.listItem()
                .title('Articles')
                .child(
                  S.documentList()
                    .title('Articles')
                    .filter('_type == "article"')
                ),
              S.listItem()
                .title('About')
                .child(
                  S.documentList()
                    .title('About')
                    .filter('_type == "about"')
                ),
              S.listItem()
                .title('Contact')
                .child(
                  S.documentList()
                    .title('Contact')
                    .filter('_type == "contact"')
                ),
              S.listItem()
                .title('FAQs')
                .child(
                  S.documentList()
                    .title('FAQs')
                    .filter('_type == "faq"')
                ),
              S.listItem()
                .title('Licenses')
                .child(
                  S.documentList()
                    .title('Licenses')
                    .filter('_type == "licenses"')
                ),
              S.listItem()
                .title('Payment Options')
                .child(
                  S.documentList()
                    .title('Payment Options')
                    .filter('_type == "paymentOptions"')
                ),
              S.listItem()
                .title('Calculators')
                .child(
                  S.documentList()
                    .title('Calculators')
                    .filter('_type == "calculator"')
                ),
              S.listItem()
                .title('Landing Page')
                .child(
                  S.documentList()
                    .title('Landing Page')
                    .filter('_type == "landingPage"')
                ),
              S.listItem()
                .title('Click Tracking')
                .child(
                  S.documentList()
                    .title('Click Tracking')
                    .filter('_type == "clickTracking"')
                ),
              S.listItem()
                .title('Hamburger Menu')
                .child(
                  S.documentList()
                    .title('Add Page')
                    .filter('_type == "hamburgerMenu"')
                ),
              S.listItem()
                .title('Footer')
                .child(
                  S.documentList()
                    .title('Footer')
                    .filter('_type == "footer"')
                ),
            ])
        ),

      // Divider
      S.divider(),

      // All Documents (for admin purposes)
      S.listItem()
        .title('All Documents')
        .child(
          S.list()
            .title('All Documents')
            .items(S.documentTypeListItems())
        ),
    ])
