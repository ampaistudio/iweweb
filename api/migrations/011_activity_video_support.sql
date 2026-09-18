ALTER TABLE activity_images
  ADD COLUMN media_type ENUM('image', 'video') NOT NULL DEFAULT 'image' AFTER image_url,
  ADD COLUMN poster_url VARCHAR(500) NULL AFTER media_type;

