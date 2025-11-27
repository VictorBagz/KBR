import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oqgxswpuxdrmktfpibcu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZ3hzd3B1eGRybWt0ZnBpYmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjAwNDksImV4cCI6MjA3NTMzNjA0OX0.5rck-KC515McQPHwhRLc_1HnyomxOr4LxJ6dJ5jzFnw';

export const supabase = createClient(supabaseUrl, supabaseKey);