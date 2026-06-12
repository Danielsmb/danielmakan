-- ============================================
-- CYBERSEARCH DATABASE SCHEMA
-- Database: Neon.tech (Serverless PostgreSQL)
-- ============================================

-- Drop table if exists (untuk reset)
DROP TABLE IF EXISTS menu CASCADE;

-- Create menu table
CREATE TABLE menu (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster search
CREATE INDEX idx_menu_title ON menu(title);
CREATE INDEX idx_menu_created ON menu(created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_updated_at
    BEFORE UPDATE ON menu
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================
INSERT INTO menu (title, info) VALUES
('NASI GORENG SPESIAL', 'Nasi goreng dengan telur, ayam, udang, dan sayuran segar. Disajikan dengan kerupuk dan acar. Level pedas bisa disesuaikan.'),
('MIE AYAM BAKSO', 'Mie ayam dengan topping bakso sapi, pangsit goreng, dan sawi hijau. Kuah kaldu ayam gurih.'),
('AYAM BAKAR MADU', 'Ayam kampung bakar dengan olesan madu special. Disajikan dengan lalapan, sambal, dan nasi putih.'),
('SOTO AYAM LAMONGAN', 'Soto ayam khas Lamongan dengan koya, telur, dan perasan jeruk nipis. Kuah bening segar.'),
('ES TEH MANIS', 'Teh manis dingin segar dengan es batu. Pilihan: teh tubruk atau teh celup.'),
('JUS ALPUKAT', 'Jus alpukat segar dengan susu coklat dan sirup. Creamy dan menyegarkan.'),
('CAPCAY GORENG', 'Capcay goreng dengan berbagai sayuran segar, ayam, dan bakso ikan. Disajikan dengan nasi putih.'),
('SATE AYAM', '10 tusuk sate ayam dengan bumbu kacang special, lontong, dan bawang merah.');

-- Verify data
SELECT * FROM menu ORDER BY id;
