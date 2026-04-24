

CREATE TABLE IF NOT EXISTS tickets (
  num     INTEGER PRIMARY KEY,
  status  TEXT    NOT NULL 
             CHECK (status IN ('idle', 'preparing', 'ready'))
             DEFAULT 'idle'
);

INSERT INTO tickets (num, status)
SELECT generate_series(1, 12), 'idle'
ON CONFLICT (num) DO NOTHING;
