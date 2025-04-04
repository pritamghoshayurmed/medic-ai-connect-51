-- Function to get all messages between two users
CREATE OR REPLACE FUNCTION get_messages_between_users(user1_id UUID, user2_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  timestamp TIMESTAMPTZ,
  read BOOLEAN
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.sender_id, m.receiver_id, m.content, 
         COALESCE(m.timestamp, NOW()) as timestamp, 
         COALESCE(m.read, false) as read
  FROM messages m
  WHERE (m.sender_id = user1_id AND m.receiver_id = user2_id)
     OR (m.sender_id = user2_id AND m.receiver_id = user1_id)
  ORDER BY m.timestamp ASC;
END;
$$; 