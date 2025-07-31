import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Nigeria Section
      S.listItem()
        .title('🇳🇬 Nigeria')
        .child(
          S.list()
            .title('Nigeria Content')
            .items([
              S.listItem()
                .title('Bookmakers')
                .child(
                  S.documentList()
                    .title('Nigeria Bookmakers')
                    .filter('_type == "bookmaker" && country == "Nigeria"')
                ),
              S.listItem()
                .title('Bonus Types')
                .child(
                  S.documentList()
                    .title('Nigeria Bonus Types')
                    .filter('_type == "bonusType" && country == "Nigeria"')
                ),
              S.listItem()
                .title('Offers')
                .child(
                  S.documentList()
                    .title('Nigeria Offers')
                    .filter('_type == "offers" && bookmaker->country == "Nigeria"')
                ),
            ])
        ),

      // Ghana Section
      S.listItem()
        .title('🇬🇭 Ghana')
        .child(
          S.list()
            .title('Ghana Content')
            .items([
              S.listItem()
                .title('Bookmakers')
                .child(
                  S.documentList()
                    .title('Ghana Bookmakers')
                    .filter('_type == "bookmaker" && country == "Ghana"')
                ),
              S.listItem()
                .title('Bonus Types')
                .child(
                  S.documentList()
                    .title('Ghana Bonus Types')
                    .filter('_type == "bonusType" && country == "Ghana"')
                ),
              S.listItem()
                .title('Offers')
                .child(
                  S.documentList()
                    .title('Ghana Offers')
                    .filter('_type == "offers" && bookmaker->country == "Ghana"')
                ),
            ])
        ),

      // Worldwide Section
      S.listItem()
        .title('🌍 Worldwide')
        .child(
          S.list()
            .title('Worldwide Content')
            .items([
              S.listItem()
                .title('Articles')
                .child(
                  S.documentList()
                    .title('Articles')
                    .filter('_type == "article"')
                ),
              S.listItem()
                .title('Banners')
                .child(
                  S.documentList()
                    .title('Banners')
                    .filter('_type == "banner"')
                ),
              S.listItem()
                .title('FAQs')
                .child(
                  S.documentList()
                    .title('FAQs')
                    .filter('_type == "faq"')
                ),
              S.listItem()
                .title('SEO Settings')
                .child(
                  S.documentList()
                    .title('SEO Settings')
                    .filter('_type == "seoSettings"')
                ),
              S.listItem()
                .title('Click Tracking')
                .child(
                  S.documentList()
                    .title('Click Tracking')
                    .filter('_type == "clickTracking"')
                ),
              S.listItem()
                .title('Comparisons')
                .child(
                  S.documentList()
                    .title('Comparisons')
                    .filter('_type == "comparison"')
                ),
            ])
        ),

      // Divider
      S.divider(),

      // All Documents (for admin purposes)
      S.listItem()
        .title('📋 All Documents')
        .child(
          S.list()
            .title('All Documents')
            .items(S.documentTypeListItems())
        ),
    ])
