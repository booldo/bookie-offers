import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'
import { Button, Dialog, TextInput, Stack, Card, Box, Select, Text, Spinner } from '@sanity/ui'

function BonusTypeDropdown(props) {
  const { value, onChange, document } = props
  const client = useClient()
  const [bonusTypes, setBonusTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  // All fields from bonusType schema
  const [newBonus, setNewBonus] = useState({
    name: '',
    metaTitle: '',
    metaDescription: '',
    comparison: '',
    faqs: [{ question: '', answer: '' }],
    noindex: false,
    nofollow: false,
    canonicalUrl: '',
    sitemapInclude: true,
    isActive: true
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchBonusTypes() {
      setLoading(true)
      try {
        let query = '*[_type == "bonusType" && isActive == true'
        if (document?.country?._ref) {
          query += ' && country._ref == $countryId'
        }
        query += '] | order(name asc){ _id, name }'
        const params = document?.country?._ref ? { countryId: document.country._ref } : {}
        const result = await client.fetch(query, params)
        setBonusTypes(result)
      } catch (e) {
        setBonusTypes([])
      } finally {
        setLoading(false)
      }
    }
    fetchBonusTypes()
  }, [document?.country?._ref, client, creating])

  const handleChange = (e) => {
    const selectedId = e.target.value
    if (selectedId === '__create__') {
      setShowDialog(true)
    } else {
      onChange(selectedId ? { _ref: selectedId, _type: 'bonusType' } : null)
    }
  }

  const handleDialogClose = () => {
    setShowDialog(false)
    setNewBonus({
      name: '',
      metaTitle: '',
      metaDescription: '',
      comparison: '',
      faqs: [{ question: '', answer: '' }],
      noindex: false,
      nofollow: false,
      canonicalUrl: '',
      sitemapInclude: true,
      isActive: true
    })
    setError('')
  }

  const handleInput = (field) => (e) => {
    setNewBonus({ ...newBonus, [field]: e.target.value })
  }

  // For comparison (rich text), we use a textarea for now
  const handleFaqChange = (idx, field) => (e) => {
    const faqs = [...newBonus.faqs]
    faqs[idx][field] = e.target.value
    setNewBonus({ ...newBonus, faqs })
  }
  const addFaq = () => {
    setNewBonus({ ...newBonus, faqs: [...newBonus.faqs, { question: '', answer: '' }] })
  }
  const removeFaq = (idx) => {
    const faqs = [...newBonus.faqs]
    faqs.splice(idx, 1)
    setNewBonus({ ...newBonus, faqs })
  }

  const handleSwitch = (field) => (e) => {
    setNewBonus({ ...newBonus, [field]: e.target.checked })
  }

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    if (!newBonus.name) {
      setError('Bonus name is required')
      setCreating(false)
      return
    }
    try {
      // Check for duplicate
      const exists = await client.fetch(
        '*[_type == "bonusType" && name == $name && country._ref == $countryId][0]',
        { name: newBonus.name, countryId: document?.country?._ref }
      )
      if (exists) {
        setError('A bonus type with this name already exists for this country')
        setCreating(false)
        return
      }
      const slug = `${document?.country?.countryCode?.toLowerCase() || 'xx'}/${newBonus.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
      const doc = await client.create({
        _type: 'bonusType',
        name: newBonus.name,
        country: { _ref: document?.country?._ref, _type: 'reference' },
        slug: { current: slug },
        comparison: [{ _type: 'block', style: 'normal', children: [{ _type: 'span', text: newBonus.comparison }] }],
        faqs: newBonus.faqs.filter(f => f.question && f.answer).map(f => ({ question: f.question, answer: f.answer })),
        metaTitle: newBonus.metaTitle,
        metaDescription: newBonus.metaDescription,
        noindex: newBonus.noindex,
        nofollow: newBonus.nofollow,
        canonicalUrl: newBonus.canonicalUrl,
        sitemapInclude: newBonus.sitemapInclude,
        isActive: newBonus.isActive
      })
      setShowDialog(false)
      setNewBonus({
        name: '',
        metaTitle: '',
        metaDescription: '',
        comparison: '',
        faqs: [{ question: '', answer: '' }],
        noindex: false,
        nofollow: false,
        canonicalUrl: '',
        sitemapInclude: true,
        isActive: true
      })
      setError('')
      onChange({ _ref: doc._id, _type: 'bonusType' })
    } catch (e) {
      setError('Failed to create bonus type')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <Select
        value={value?._ref || ''}
        onChange={handleChange}
        disabled={loading}
        style={{ width: '100%' }}
      >
        <option value="">{loading ? 'Loading bonus types...' : 'Select a bonus type'}</option>
        {bonusTypes.map((bt) => (
          <option key={bt._id} value={bt._id}>{bt.name}</option>
        ))}
        <option value="__create__">+ Create new bonus type</option>
      </Select>
      {showDialog && (
        <Dialog
          header="Create New Bonus Type"
          id="create-bonus-type-dialog"
          width={1}
          onClose={handleDialogClose}
          zOffset={100}
        >
          <Box padding={4}>
            <Stack space={3}>
              <TextInput
                placeholder="Bonus type name"
                value={newBonus.name}
                onChange={handleInput('name')}
                disabled={creating}
              />
              <TextInput
                placeholder="Meta Title (optional)"
                value={newBonus.metaTitle}
                onChange={handleInput('metaTitle')}
                disabled={creating}
              />
              <TextInput
                placeholder="Meta Description (optional)"
                value={newBonus.metaDescription}
                onChange={handleInput('metaDescription')}
                disabled={creating}
              />
              <TextInput
                placeholder="Canonical URL (optional)"
                value={newBonus.canonicalUrl}
                onChange={handleInput('canonicalUrl')}
                disabled={creating}
              />
              <Box>
                <Text>Bonus Content (Rich Text)</Text>
                <textarea
                  placeholder="Bonus content (rich text)"
                  value={newBonus.comparison}
                  onChange={handleInput('comparison')}
                  disabled={creating}
                  style={{ width: '100%', minHeight: 60 }}
                />
              </Box>
              <Box>
                <Text>FAQs</Text>
                {newBonus.faqs.map((faq, idx) => (
                  <Box key={idx} padding={2} style={{ border: '1px solid #eee', marginBottom: 4 }}>
                    <TextInput
                      placeholder="FAQ Question"
                      value={faq.question}
                      onChange={handleFaqChange(idx, 'question')}
                      disabled={creating}
                      style={{ marginBottom: 4 }}
                    />
                    <TextInput
                      placeholder="FAQ Answer"
                      value={faq.answer}
                      onChange={handleFaqChange(idx, 'answer')}
                      disabled={creating}
                    />
                    {newBonus.faqs.length > 1 && (
                      <Button text="Remove" tone="critical" onClick={() => removeFaq(idx)} disabled={creating} />
                    )}
                  </Box>
                ))}
                <Button text="Add FAQ" tone="primary" onClick={addFaq} disabled={creating} />
              </Box>
              <Stack direction="horizontal" space={3}>
                <input
                  type="checkbox"
                  checked={newBonus.noindex}
                  onChange={handleSwitch('noindex')}
                  disabled={creating}
                />
                <Text>SEO: Noindex</Text>
                <input
                  type="checkbox"
                  checked={newBonus.nofollow}
                  onChange={handleSwitch('nofollow')}
                  disabled={creating}
                />
                <Text>SEO: Nofollow</Text>
                <input
                  type="checkbox"
                  checked={newBonus.sitemapInclude}
                  onChange={handleSwitch('sitemapInclude')}
                  disabled={creating}
                />
                <Text>Include in Sitemap</Text>
                <input
                  type="checkbox"
                  checked={newBonus.isActive}
                  onChange={handleSwitch('isActive')}
                  disabled={creating}
                />
                <Text>Is Active</Text>
              </Stack>
              {error && <Text style={{ color: 'red' }}>{error}</Text>}
              <Button
                text={creating ? <Spinner /> : 'Create Bonus Type'}
                tone="primary"
                onClick={handleCreate}
                disabled={creating}
              />
              <Button text="Cancel" tone="default" onClick={handleDialogClose} disabled={creating} />
            </Stack>
          </Box>
        </Dialog>
      )}
    </>
  )
}

export default BonusTypeDropdown
