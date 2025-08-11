export default {
  name: 'codeBlock',
  title: 'Code Block',
  type: 'object',
  fields: [
    {
      name: 'type',
      title: 'Code Type',
      type: 'string',
      options: {
        list: [
          { title: 'Display Code (Syntax Highlighted)', value: 'display' },
          { title: 'Execute Code (Show Result Only)', value: 'execute' }
        ]
      },
      initialValue: 'display',
      validation: Rule => Rule.required()
    },
    {
      name: 'code',
      title: 'Code',
      type: 'text',
      validation: Rule => Rule.required(),
      description: ({ parent }) => parent?.type === 'execute' 
        ? 'Paste HTML/JavaScript code here. Only the result will be displayed, not the code itself.'
        : 'Paste your code here for syntax highlighting display.'
    },
    {
      name: 'language',
      title: 'Language (for display type)',
      type: 'string',
      options: {
        list: [
          { title: 'JavaScript', value: 'javascript' },
          { title: 'TypeScript', value: 'typescript' },
          { title: 'HTML', value: 'html' },
          { title: 'CSS', value: 'css' },
          { title: 'Python', value: 'python' },
          { title: 'Java', value: 'java' },
          { title: 'C++', value: 'cpp' },
          { title: 'C#', value: 'csharp' },
          { title: 'PHP', value: 'php' },
          { title: 'Ruby', value: 'ruby' },
          { title: 'Go', value: 'go' },
          { title: 'Rust', value: 'rust' },
          { title: 'Swift', value: 'swift' },
          { title: 'Kotlin', value: 'kotlin' },
          { title: 'SQL', value: 'sql' },
          { title: 'JSON', value: 'json' },
          { title: 'YAML', value: 'yaml' },
          { title: 'Markdown', value: 'markdown' },
          { title: 'Shell', value: 'shell' },
          { title: 'Plain Text', value: 'text' }
        ]
      },
      initialValue: 'javascript',
      hidden: ({ parent }) => parent?.type === 'execute'
    },
    {
      name: 'filename',
      title: 'Filename (optional)',
      type: 'string',
      description: 'Optional filename to display above the code block'
    },
    {
      name: 'description',
      title: 'Description (for execute type)',
      type: 'text',
      description: 'Optional description of what the embedded code does',
      hidden: ({ parent }) => parent?.type === 'display'
    }
  ],
  preview: {
    select: {
      type: 'type',
      code: 'code',
      language: 'language',
      filename: 'filename',
      description: 'description'
    },
    prepare(selection) {
      const { type, code, language, filename, description } = selection;
      const preview = code ? code.substring(0, 50) + (code.length > 50 ? '...' : '') : 'No code';
      
      if (type === 'execute') {
        return {
          title: filename || 'Embedded Code',
          subtitle: description || preview
        };
      }
      
      return {
        title: filename || `${language} code block`,
        subtitle: preview
      };
    }
  }
};
