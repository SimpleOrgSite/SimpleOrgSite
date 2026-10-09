-- Run in the Supabase SQL editor AFTER uploading the .svg files in this folder to the 'logo-library' storage bucket.
-- Safe to re-run: it replaces the insurance rows each time.
delete from public.logo_library where category = 'insurance';
insert into public.logo_library (category, name, path, sort_order) values
  ('insurance', 'UnitedHealthcare',   'unitedhealthcare.svg',   10),
  ('insurance', 'Anthem',             'anthem.svg',             20),
  ('insurance', 'Aetna',              'aetna.svg',              30),
  ('insurance', 'Humana',             'humana.svg',             40),
  ('insurance', 'Kaiser Permanente',  'kaiser-permanente.svg',  50),
  ('insurance', 'Molina Healthcare',  'molina.svg',             60),
  ('insurance', 'Oscar',              'oscar.svg',              70),
  ('insurance', 'Highmark',           'highmark.svg',           80),
  ('insurance', 'Optum',              'optum.svg',              90);
