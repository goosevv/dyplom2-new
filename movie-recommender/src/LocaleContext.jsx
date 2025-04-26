import { createContext } from 'react'

export const LocaleContext = createContext({
  tmdbLang: 'uk-UA',
  setTmdbLang: () => {}
})
