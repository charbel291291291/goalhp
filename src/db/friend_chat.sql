-- Friend chat messages
CREATE TABLE IF NOT EXISTS friend_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_friend_messages_participants ON friend_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_messages_created_at ON friend_messages(created_at DESC);

ALTER TABLE friend_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users send messages" ON friend_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users read own messages" ON friend_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users mark as read" ON friend_messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Enable realtime for friend_messages
ALTER PUBLICATION supabase_realtime ADD TABLE friend_messages;
