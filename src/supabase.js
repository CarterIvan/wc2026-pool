import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://amgajwlqgoqrzzowzoxz.supabase.co'

const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZ2Fqd2xxZ29xcnp6b3d6b3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTA4OTYsImV4cCI6MjA5Njc2Njg5Nn0.vqjv8sXlZhnVoFHAtUmiUkBQnaIoMRUd5ZZO5ZMetss'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)