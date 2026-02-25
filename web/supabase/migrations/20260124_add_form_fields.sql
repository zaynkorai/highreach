-- Add description and status to forms table
ALTER TABLE forms 
ADD COLUMN description TEXT,
ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived'));
