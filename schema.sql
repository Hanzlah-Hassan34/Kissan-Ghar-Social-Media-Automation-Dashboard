-- 1. ENUM types for statuses and small constrained sets
CREATE TYPE product_status AS ENUM ('active','inactive');
CREATE TYPE video_status AS ENUM ('pending','generating_script','script_generated','generating_video','video_generated_pending','video_generated');

CREATE TYPE status AS ENUM ('pending','generating','generated','approved','rejected');
CREATE TYPE languageType AS ENUM (
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Urdu',
  'Arabic',
  'Japanese',
  'Korean',
  'Chinese',
  'Indonesian',
  'Vietnamese',
  'Thai',
  'Dutch',
  'Turkish',
  'Polish',
  'Ukrainian',
  'Swedish',
  'Czech',
  'Danish',
  'Finnish',
  'Norwegian',
  'Romanian',
  'Greek',
  'Hungarian',
  'Hebrew'
);

CREATE TYPE publish_status AS ENUM ('pending','Uploading','uploaded');
CREATE TYPE screen_size AS ENUM ('1:1','9:16','16:9','4:5','full'); -- extend as needed
CREATE TYPE upload_platform AS ENUM ('All','youtube','facebook','tiktok','instagram');

-- 2. core reference tables (companies/categories/subcategories) - same as before
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    img VARCHAR(255)
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    img VARCHAR(255)
);

CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    cat_id INT REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    UNIQUE(cat_id, name)
);
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    company_id INT REFERENCES companies(id) ON DELETE SET NULL,
    cat_id INT REFERENCES categories(id) ON DELETE SET NULL,
    subcat_id INT REFERENCES subcategories(id) ON DELETE SET NULL,
    pname VARCHAR(255) NOT NULL,
    quantity VARCHAR(100),
    sprice NUMERIC(10,2),
    act_price NUMERIC(10,2),
    img VARCHAR(255),
    imgb VARCHAR(255),
    imgc VARCHAR(255),
    imgd VARCHAR(255),
    detail TEXT,
    phighlights TEXT,
    size1 VARCHAR(100),
    act_ingredient VARCHAR(255),
    weight VARCHAR(100),
    tank_capacity VARCHAR(100),
    sdetail TEXT
);

CREATE INDEX idx_products_pname ON products(pname);



CREATE TABLE generatedVideos (
    id SERIAL PRIMARY KEY,
    prompt VARCHAR(500),               
    duration_seconds INT,             
    screen_size screen_size DEFAULT '16:9',
    video_status video_status DEFAULT 'pending',
    script TEXT,
	language languageType DEFAULT 'Urdu',
    file_path VARCHAR(255),            -- path to generated MP4 (if stored)
    file_size BIGINT,
    duration_actual_seconds INT,
    preview_url VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


create table publishedVideo(
    id SERIAL PRIMARY KEY,
	generatedVideos_id INT REFERENCES generatedVideos(id) ON DELETE SET NULL,
	title TEXT,
     title_status status DEFAULT 'pending',
	 description TEXT,
    description_status VARCHAR(50) DEFAULT 'pending',
	tags TEXT,
    tags_status VARCHAR(50) DEFAULT 'pending',
    tags_generated_count INT DEFAULT 0,
	publish_status publish_status  DEFAULT 'pending',
    platform upload_platform ,
    platform_video_id VARCHAR(255),   
    url VARCHAR(1000),
    status VARCHAR(50) DEFAULT 'pending', -- pending/uploading/published/failed
    uploaded_at TIMESTAMP WITH TIME ZONE
);

-- 6. product references (many-to-many): selected reference products for a video
CREATE TABLE video_references (
    id SERIAL PRIMARY KEY,
    video_id INT REFERENCES generatedVideos(id) ON DELETE CASCADE,
    reference_product_id INT REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(video_id, reference_product_id)
);

CREATE INDEX idx_video_references_video ON video_references(video_id);




-- 8. Optional: a compact analytics table for daily aggregates (you already had something similar)
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_products INT DEFAULT 0,
    scripts_generated INT DEFAULT 0,
    videos_generated INT DEFAULT 0,
    videos_published INT DEFAULT 0,
    pending_approvals INT DEFAULT 0
);

UPDATE products
SET img = CONCAT('https://kissanghar.pk/assets/img/product/', img);
