import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qulvrkqkiwvxovcgwyfu.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bHZya3FraXd2eG92Y2d3eWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMjIzNjYsImV4cCI6MjA1OTY5ODM2Nn0.JtG716ArtwrL9fc057LEY2Y_sMxBRCNfji9fYnrUYzM'; // Reemplaza con tu clave anon
export const supabase = createClient(supabaseUrl, supabaseKey);