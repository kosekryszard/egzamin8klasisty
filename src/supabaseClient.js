import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

Stwórz plik `.gitignore` (żeby nie wrzucić kluczy na GitHub):
```
node_modules
dist
.env.local