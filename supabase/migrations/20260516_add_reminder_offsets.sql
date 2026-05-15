-- Görev bazlı hatırlatıcı offsetleri (dakika cinsinden)
-- Örn: [5, 30, 60] → deadline'dan 5dk, 30dk, 1sa önce bildirim gönder
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_offsets INTEGER[] DEFAULT NULL;
