export default {
  name: "bonusType",
  title: "Bonus Types",
  type: "document",
  validation: Rule => Rule.custom((doc, context) => {
    if (!doc?.name || !doc?.country) return true // Skip validation if required fields are missing
    
    // Check if another bonus type with same name and country exists
    const { getClient } = context
    const client = getClient({ apiVersion: '2023-05-03' })
    
    // Use a more reliable way to exclude the current document
    const currentId = doc._id || 'draft'
    const query = `count(*[_type == "bonusType" && name == $name && country == $country && _id != $currentId])`
    
    return client.fetch(query, { name: doc.name, country: doc.country, currentId })
      .then(count => {
        if (count > 0) {
          return `A bonus type with name "${doc.name}" already exists in ${doc.country}`
        }
        return true
      })
      .catch(() => {
        // If there's an error, allow the operation
        return true
      })
  }),
  preview: {
    select: {
      title: 'name',
      subtitle: 'country',
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {
        title: title || 'Untitled Bonus Type',
        subtitle: subtitle,
      }
    }
  },
  fields: [
    { 
      name: "name", 
      title: "Bonus Name", 
      type: "string",
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: "Free Bet", value: "Free Bet" },
          { title: "Welcome Offer", value: "Welcome Offer" },
          { title: "Deposit bonus", value: "Deposit bonus" },
          { title: "ACCA Boost", value: "ACCA Boost" }
        ]
      }
    },
    {
      name: "country",
      title: "Country",
      type: "string",
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: "Nigeria", value: "Nigeria" },
          { title: "Ghana", value: "Ghana" }
        ]
      }
    },
  ]
}; 